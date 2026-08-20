"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { unggahBerkas } from "@/lib/storage/minio";
import { validasiBerkas } from "@/lib/berkas/validasi";
import { unggahBuktiTransferSchema } from "@/lib/transaksi/schema";
import { buatTransaksiSnap } from "@/lib/payment/midtrans";
import { ambilOrtuAsuhIdUser, ambilOrtuAsuhDariUser } from "@/server/queries/komitmen";
import { ambilJadwalBayarMilikOrtuAsuh } from "@/server/queries/transaksi";
import type { HasilAksi } from "@/types/aksi";

export interface HasilMulaiPembayaranVA extends HasilAksi {
  redirectUrl?: string;
}

async function sesiOrtuAsuh() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORTU_ASUH") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
}

export async function unggahBuktiTransfer(formData: FormData): Promise<HasilAksi> {
  const user = await sesiOrtuAsuh();
  const ortuAsuhId = await ambilOrtuAsuhIdUser(user.id);

  const parsed = unggahBuktiTransferSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }
  const input = parsed.data;

  let komitmenId: string | null = null;
  if (input.jadwalBayarId) {
    const jadwal = await ambilJadwalBayarMilikOrtuAsuh(input.jadwalBayarId, user.id);
    if (!jadwal) {
      return { sukses: false, pesan: "Jadwal bayar tidak ditemukan." };
    }
    if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
      return { sukses: false, pesan: "Jadwal ini sudah tidak menerima pembayaran baru." };
    }
    komitmenId = jadwal.komitmenId;
  }

  const file = formData.get("bukti");
  if (!(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "Bukti transfer wajib diunggah." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validasi = validasiBerkas({ mimeType: file.type, ukuranByte: buffer.length });
  if (!validasi.valid) {
    return { sukses: false, pesan: validasi.pesan ?? "Berkas tidak valid." };
  }

  const ekstensi = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const objectKey = `transaksi/${ortuAsuhId}/${randomUUID()}.${ekstensi}`;
  await unggahBerkas(objectKey, buffer, file.type);

  const transaksi = await prisma.$transaction(async (tx) => {
    const dibuat = await tx.transaksi.create({
      data: {
        ortuAsuhId,
        komitmenId,
        jadwalBayarId: input.jadwalBayarId || null,
        nominal: input.nominal,
        metode: input.metode,
        buktiObjectKey: objectKey,
        tglBayar: input.tglBayar,
      },
    });

    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "transaksi.unggah_bukti",
      entitas: "transaksi",
      entitasId: dibuat.id,
      sesudah: { nominal: input.nominal.toString(), metode: input.metode },
    });

    return dibuat;
  });

  revalidatePath("/donatur/pembayaran");
  return { sukses: true, pesan: `Bukti transfer terunggah, menunggu verifikasi admin (ID ${transaksi.id}).` };
}

/**
 * Terbitkan token Snap Midtrans untuk satu JadwalBayar. Transaksi dibuat
 * MENUNGGU_VERIFIKASI di sini (persis seperti unggahBuktiTransfer), lalu
 * webhook /api/webhook/payment yang men-verifikasi lewat jalur kode yang
 * sama dengan verifikasi manual admin.
 */
export async function mulaiPembayaranVA(jadwalBayarId: string): Promise<HasilMulaiPembayaranVA> {
  const user = await sesiOrtuAsuh();
  const ortuAsuh = await ambilOrtuAsuhDariUser(user.id);

  const jadwal = await ambilJadwalBayarMilikOrtuAsuh(jadwalBayarId, user.id);
  if (!jadwal) {
    return { sukses: false, pesan: "Jadwal bayar tidak ditemukan." };
  }
  if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
    return { sukses: false, pesan: "Jadwal ini sudah tidak menerima pembayaran baru." };
  }

  const pengguna = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
  const orderId = `jadwal-${jadwalBayarId}-${Date.now()}`;

  let snap;
  try {
    snap = await buatTransaksiSnap({
      orderId,
      grossAmount: jadwal.nominal,
      namaDonatur: ortuAsuh.atasNamaMunfiq || ortuAsuh.nama,
      emailDonatur: pengguna?.email ?? "",
    });
  } catch (error) {
    return { sukses: false, pesan: error instanceof Error ? error.message : "Gagal membuat transaksi pembayaran." };
  }

  await prisma.$transaction(async (tx) => {
    const dibuat = await tx.transaksi.create({
      data: {
        ortuAsuhId: ortuAsuh.id,
        komitmenId: jadwal.komitmenId,
        jadwalBayarId,
        nominal: jadwal.nominal,
        metode: "VIRTUAL_ACCOUNT",
        refEksternal: orderId,
        tglBayar: new Date(),
      },
    });
    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "transaksi.mulai_bayar_va",
      entitas: "transaksi",
      entitasId: dibuat.id,
      sesudah: { orderId, nominal: jadwal.nominal.toString() },
    });
  });

  return { sukses: true, pesan: "Silakan lanjutkan pembayaran.", redirectUrl: snap.redirectUrl };
}
