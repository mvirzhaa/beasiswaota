"use server";

import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { buatTransaksiSnap } from "@/lib/payment/midtrans";
import type { HasilAksi } from "@/types/aksi";

export interface HasilMulaiPembayaranVA extends HasilAksi {
  redirectUrl?: string;
}

/**
 * Terbitkan token Snap Midtrans untuk satu JadwalBayar. Halaman ini publik
 * (tanpa login — donatur tidak punya akun, lihat CLAUDE.md), jadi otorisasi
 * dicek dari kodeAkses di URL: jadwalBayarId WAJIB milik ortuAsuh pemilik
 * kodeAkses ini, bukan sekadar ID yang valid di database mana pun (IDOR).
 *
 * Transaksi dibuat MENUNGGU_VERIFIKASI di sini (persis seperti verifikasi
 * manual admin), lalu webhook /api/webhook/payment yang memverifikasi lewat
 * jalur kode yang sama.
 */
export async function mulaiPembayaranVA(
  kodeAkses: string,
  jadwalBayarId: string,
): Promise<HasilMulaiPembayaranVA> {
  const ortuAsuh = await prisma.ortuAsuh.findUnique({ where: { kodeAkses } });
  if (!ortuAsuh) {
    return { sukses: false, pesan: "Kode akses tidak valid." };
  }

  const jadwal = await prisma.jadwalBayar.findUnique({
    where: { id: jadwalBayarId },
    include: { komitmen: true },
  });
  if (!jadwal || jadwal.komitmen.ortuAsuhId !== ortuAsuh.id) {
    return { sukses: false, pesan: "Jadwal bayar tidak ditemukan." };
  }
  if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
    return { sukses: false, pesan: "Jadwal ini sudah tidak menerima pembayaran baru." };
  }

  const orderId = `jadwal-${jadwalBayarId}-${Date.now()}`;

  let snap;
  try {
    snap = await buatTransaksiSnap({
      orderId,
      grossAmount: jadwal.nominal,
      namaDonatur: ortuAsuh.atasNamaMunfiq || ortuAsuh.nama,
      emailDonatur: ortuAsuh.email ?? "",
    });
  } catch (error) {
    return {
      sukses: false,
      pesan: error instanceof Error ? error.message : "Gagal membuat transaksi pembayaran.",
    };
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
      aktorId: null,
      aksi: "transaksi.mulai_bayar_va",
      entitas: "transaksi",
      entitasId: dibuat.id,
      sesudah: { orderId, nominal: jadwal.nominal.toString() },
    });
  });

  return { sukses: true, pesan: "Silakan lanjutkan pembayaran.", redirectUrl: snap.redirectUrl };
}
