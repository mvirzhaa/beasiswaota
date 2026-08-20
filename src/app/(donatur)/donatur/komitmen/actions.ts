"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { parseRupiah } from "@/lib/uang";
import { buatKomitmenSchema } from "@/lib/komitmen/schema";
import { generateJadwal, type RitmeKomitmen } from "@/lib/komitmen/jadwal";
import {
  ambilOrtuAsuhDariUser,
  ambilKomitmenMilikOrtuAsuh,
} from "@/server/queries/komitmen";
import type { HasilAksi } from "@/types/aksi";

async function sesiOrtuAsuh() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORTU_ASUH") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function buatKomitmen(formData: FormData): Promise<HasilAksi> {
  const user = await sesiOrtuAsuh();
  const ortuAsuh = await ambilOrtuAsuhDariUser(user.id);

  const parsed = buatKomitmenSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }
  const input = parsed.data;

  const periodeAwal = await prisma.periode.findUnique({
    where: { id: input.periodeAwalId },
  });
  if (!periodeAwal) {
    return { sukses: false, pesan: "Periode tidak ditemukan." };
  }
  if (periodeAwal.status === "SELESAI") {
    return { sukses: false, pesan: "Periode ini sudah terkunci, tidak bisa dipakai untuk komitmen baru." };
  }

  // Nominal per periode ditentukan dari skema, bukan sekadar dipercaya dari client.
  let nominalPerPeriode: bigint;
  if (input.skema === "FULL") {
    nominalPerPeriode = periodeAwal.nominalFull;
  } else {
    if (!input.nominalPerPeriode) {
      return { sukses: false, pesan: "Nominal per periode wajib diisi." };
    }
    try {
      nominalPerPeriode = parseRupiah(input.nominalPerPeriode);
    } catch {
      return { sukses: false, pesan: "Nominal per periode tidak valid." };
    }
    if (nominalPerPeriode <= 0n) {
      return { sukses: false, pesan: "Nominal per periode harus lebih dari nol." };
    }
    if (input.skema === "PARSIAL" && nominalPerPeriode >= periodeAwal.nominalFull) {
      return {
        sukses: false,
        pesan: "Skema PARSIAL harus lebih kecil dari nominal paket penuh periode ini.",
      };
    }
  }

  const jumlahPeriode =
    input.jumlahPeriodeOpsi === "CUSTOM"
      ? input.jumlahPeriodeCustom
      : Number(input.jumlahPeriodeOpsi);
  if (!jumlahPeriode || jumlahPeriode < 1) {
    return { sukses: false, pesan: "Jangka waktu tidak valid." };
  }

  // Aturan keras: POTONG_GAJI hanya untuk dosen/tendik ber-NIP, divalidasi di server.
  if (input.mekanisme === "POTONG_GAJI") {
    const tipeBoleh = ortuAsuh.tipe === "DOSEN" || ortuAsuh.tipe === "TENAGA_KEPENDIDIKAN";
    if (!tipeBoleh || !ortuAsuh.nip) {
      return {
        sukses: false,
        pesan: "Potong gaji hanya untuk dosen/tenaga kependidikan UIKA dengan NIP terisi.",
      };
    }
  }

  const ritme: RitmeKomitmen = input.mekanisme === "POTONG_GAJI" ? "PER_BULAN" : "PER_PERIODE";
  const tipe = jumlahPeriode === 1 ? ("SEKALI" as const) : ("BERULANG" as const);

  const preferensiMentah = {
    fakultas: input.preferensiFakultas?.trim() || undefined,
    prodi: input.preferensiProdi?.trim() || undefined,
    gender: input.preferensiGender?.trim() || undefined,
    asalDaerah: input.preferensiAsalDaerah?.trim() || undefined,
  };
  const preferensi = Object.fromEntries(
    Object.entries(preferensiMentah).filter(([, v]) => v !== undefined),
  );

  // Rencana penuh (semua kePeriode) dipakai untuk estimasi; yang benar-benar
  // ditulis ke DB hanya periode pertama karena Periode untuk periode ke-2
  // dst umumnya belum dibuat admin. Sisanya digenerate cron Sesi 8 begitu
  // Periode aslinya ada, memakai fungsi murni yang sama.
  const rencana = generateJadwal({ jumlahPeriode, ritme, nominalPerPeriode }, periodeAwal);
  const barisPeriodePertama = rencana.filter((b) => b.kePeriode === 1);

  const komitmen = await prisma.$transaction(async (tx) => {
    const dibuat = await tx.komitmen.create({
      data: {
        ortuAsuhId: ortuAsuh.id,
        skema: input.skema,
        nominalPerPeriode,
        jumlahPeriode,
        tipe,
        mekanisme: input.mekanisme,
        ritme,
        preferensi: Object.keys(preferensi).length > 0 ? preferensi : undefined,
        tglMulai: periodeAwal.tglBuka,
        catatan: input.catatan?.trim() || null,
      },
    });

    await tx.jadwalBayar.createMany({
      data: barisPeriodePertama.map((b) => ({
        komitmenId: dibuat.id,
        periodeId: periodeAwal.id,
        urutan: b.urutan,
        nominal: b.nominal,
        jatuhTempo: b.jatuhTempo,
      })),
    });

    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "komitmen.buat",
      entitas: "komitmen",
      entitasId: dibuat.id,
      sesudah: {
        skema: input.skema,
        nominalPerPeriode: nominalPerPeriode.toString(),
        jumlahPeriode,
        mekanisme: input.mekanisme,
      },
    });

    return dibuat;
  });

  revalidatePath("/donatur/komitmen");
  revalidatePath("/donatur/pembayaran");
  return {
    sukses: true,
    pesan: `Komitmen dibuat, menunggu konfirmasi admin (ID ${komitmen.id}).`,
  };
}

export async function batalkanKomitmen(komitmenId: string): Promise<HasilAksi> {
  const user = await sesiOrtuAsuh();

  const komitmen = await ambilKomitmenMilikOrtuAsuh(komitmenId, user.id);
  if (!komitmen) {
    return { sukses: false, pesan: "Komitmen tidak ditemukan." };
  }
  if (komitmen.status === "DIBATALKAN" || komitmen.status === "SELESAI") {
    return { sukses: false, pesan: "Komitmen ini sudah tidak bisa dibatalkan." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.komitmen.update({
      where: { id: komitmenId },
      data: { status: "DIBATALKAN" },
    });

    // Jadwal yang sudah TERBAYAR tidak boleh disentuh — hanya baris yang
    // belum lunas yang ikut dibatalkan.
    await tx.jadwalBayar.updateMany({
      where: {
        komitmenId,
        status: { notIn: ["TERBAYAR", "DIBATALKAN"] },
      },
      data: { status: "DIBATALKAN" },
    });

    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "komitmen.batalkan",
      entitas: "komitmen",
      entitasId: komitmenId,
      sebelum: { status: komitmen.status },
      sesudah: { status: "DIBATALKAN" },
    });
  });

  revalidatePath("/donatur/komitmen");
  revalidatePath("/donatur/pembayaran");
  return { sukses: true, pesan: "Komitmen dibatalkan." };
}
