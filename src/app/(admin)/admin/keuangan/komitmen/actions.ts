"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { parseRupiah } from "@/lib/uang";
import { kreditkanTransaksiBaru } from "@/server/actions/kreditkan-transaksi-baru";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

// ============================================================================
// Konfirmasi Komitmen SEKALIGUS catat pemasukan pertamanya — satu klik admin,
// bukan dua aksi di dua halaman terpisah. Admin baru konfirmasi komitmen
// kalau bukti transfer (atau info potongan gaji) sudah di tangan, jadi
// nominal & tanggal transfer diisi di form yang sama.
//
// Komitmen tetap diaktifkan dan Transaksi tetap dicatat sebagai DUA baris
// terpisah di DB (CLAUDE.md aturan keras #2 — lapisan Komitmen/Transaksi
// tidak digabung), hanya UX admin yang digabung jadi satu submit. Kalau
// jadwal bayar pertamanya ternyata sudah tidak ada (semua lunas/batal),
// komitmen tetap dikonfirmasi tapi TANPA pemasukan — admin diberi tahu lewat
// pesan, bisa dicatat manual lewat panel "Catat Transfer Masuk" nanti.
// ============================================================================

const konfirmasiKomitmenSchema = z.object({
  komitmenId: z.string().min(1),
  nominal: z.string().min(1, "Nominal wajib diisi"),
  tanggal: z.string().min(1, "Tanggal transfer wajib diisi"),
});

export async function konfirmasiKomitmenDanCatatPemasukan(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = konfirmasiKomitmenSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  let nominal: bigint;
  try {
    nominal = parseRupiah(parsed.data.nominal);
  } catch {
    return { sukses: false, pesan: "Nominal tidak valid." };
  }
  if (nominal <= 0n) {
    return { sukses: false, pesan: "Nominal harus lebih besar dari nol." };
  }

  const komitmen = await prisma.komitmen.findUnique({
    where: { id: parsed.data.komitmenId },
    include: {
      ortuAsuh: { select: { nama: true } },
      jadwalBayar: {
        where: { status: { notIn: ["TERBAYAR", "DIBATALKAN"] } },
        orderBy: { jatuhTempo: "asc" },
        take: 1,
      },
    },
  });
  if (!komitmen) {
    return { sukses: false, pesan: "Komitmen tidak ditemukan." };
  }
  if (komitmen.status !== "MENUNGGU_KONFIRMASI") {
    return { sukses: false, pesan: "Komitmen ini tidak dalam status menunggu konfirmasi." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.komitmen.update({
      where: { id: komitmen.id },
      data: { status: "AKTIF" },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "komitmen.konfirmasi",
      entitas: "komitmen",
      entitasId: komitmen.id,
      sebelum: { status: komitmen.status },
      sesudah: { status: "AKTIF" },
    });
  });

  const jadwal = komitmen.jadwalBayar[0];
  if (!jadwal) {
    revalidatePath("/admin/keuangan/komitmen");
    revalidatePath("/admin/keuangan/pemasukan");
    return {
      sukses: true,
      pesan: "Komitmen dikonfirmasi, tapi tidak ada jadwal bayar terbuka untuk dicatat pemasukannya.",
    };
  }

  const hasil = await kreditkanTransaksiBaru(prisma, {
    ortuAsuhId: komitmen.ortuAsuhId,
    komitmenId: komitmen.id,
    jadwalBayarId: jadwal.id,
    nominal,
    metode: komitmen.mekanisme,
    refEksternal: `konfirmasi-komitmen-${jadwal.id}`,
    tglBayar: new Date(parsed.data.tanggal),
    periodeId: jadwal.periodeId,
    keterangan: `Pemasukan pertama saat konfirmasi komitmen — ${komitmen.ortuAsuh.nama}`,
    aktorAuditId: admin.id,
    aksiAudit: "transaksi.konfirmasi_komitmen",
  });

  revalidatePath("/admin/keuangan/komitmen");
  revalidatePath("/admin/keuangan/transaksi");
  revalidatePath("/admin/keuangan/pemasukan");

  if (!hasil.sukses) {
    return {
      sukses: true,
      pesan: "Komitmen dikonfirmasi. Pemasukan jadwal ini sudah pernah dicatat sebelumnya.",
    };
  }
  return { sukses: true, pesan: "Komitmen dikonfirmasi dan pemasukan langsung tercatat." };
}

/**
 * Donatur tidak punya akun untuk membatalkan komitmennya sendiri (lihat
 * CLAUDE.md) — pembatalan sekarang lewat admin, biasanya atas permintaan
 * donatur via WA. Jadwal bayar yang belum lunas ikut dibatalkan; yang
 * sudah TERBAYAR tidak disentuh.
 */
export async function batalkanKomitmenAdmin(komitmenId: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const komitmen = await prisma.komitmen.findUnique({ where: { id: komitmenId } });
  if (!komitmen) {
    return { sukses: false, pesan: "Komitmen tidak ditemukan." };
  }
  if (komitmen.status === "DIBATALKAN" || komitmen.status === "SELESAI") {
    return { sukses: false, pesan: "Komitmen ini sudah tidak bisa dibatalkan." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.komitmen.update({ where: { id: komitmenId }, data: { status: "DIBATALKAN" } });
    await tx.jadwalBayar.updateMany({
      where: { komitmenId, status: { notIn: ["TERBAYAR", "DIBATALKAN"] } },
      data: { status: "DIBATALKAN" },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "komitmen.batalkan",
      entitas: "komitmen",
      entitasId: komitmenId,
      sebelum: { status: komitmen.status },
      sesudah: { status: "DIBATALKAN" },
    });
  });

  revalidatePath("/admin/keuangan/komitmen");
  return { sukses: true, pesan: "Komitmen dibatalkan." };
}
