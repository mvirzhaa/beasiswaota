"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { kirimWa } from "@/lib/notifikasi/wa";
import { pesanWaLaporanSemesterSiap } from "@/lib/notifikasi/template-wa";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

const pesanManualSchema = z.string().trim().min(1, "Pesan tidak boleh kosong");

// Notifikasi (bukan AuditLog) adalah catatan resmi pengiriman WA ke donatur
// — ini bukan mutasi status transaksi/alokasi (aturan keras #6), jadi cukup
// tercatat di sini. terkirimAt hanya diisi kalau kirimWa() benar-benar
// sukses — tidak pernah berpura-pura terkirim.
export async function kirimPesanWaManual(ortuAsuhId: string, pesan: string): Promise<HasilAksi> {
  await sesiAdmin();

  const parsed = pesanManualSchema.safeParse(pesan);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Pesan tidak valid." };
  }

  const ortuAsuh = await prisma.ortuAsuh.findUnique({ where: { id: ortuAsuhId } });
  if (!ortuAsuh) {
    return { sukses: false, pesan: "Donatur tidak ditemukan." };
  }

  const hasilKirim = await kirimWa(ortuAsuh.noHp, parsed.data);

  await prisma.notifikasi.create({
    data: {
      ortuAsuhId,
      kanal: "WA",
      judul: "Pesan dari Admin",
      isi: parsed.data,
      terkirimAt: hasilKirim.terkirim ? new Date() : null,
    },
  });

  revalidatePath(`/admin/orangtua-asuh/${ortuAsuhId}`);

  if (!hasilKirim.terkirim) {
    return { sukses: false, pesan: `Pesan dicatat tapi tidak terkirim: ${hasilKirim.alasan ?? "gagal mengirim"}.` };
  }
  return { sukses: true, pesan: "Pesan WA berhasil dikirim." };
}

export async function kirimLaporanWa(ortuAsuhId: string): Promise<HasilAksi> {
  await sesiAdmin();

  const ortuAsuh = await prisma.ortuAsuh.findUnique({ where: { id: ortuAsuhId } });
  if (!ortuAsuh) {
    return { sukses: false, pesan: "Donatur tidak ditemukan." };
  }

  const periodeTerbaru = await prisma.periode.findFirst({
    where: { status: { not: "DRAFT" } },
    orderBy: { tglBuka: "desc" },
  });

  const url = `${env.APP_URL}/laporan/${ortuAsuh.kodeAkses}`;
  const pesan = pesanWaLaporanSemesterSiap({
    namaDonatur: ortuAsuh.atasNamaMunfiq || ortuAsuh.nama,
    periodeKode: periodeTerbaru?.kode ?? "-",
    url,
  });

  const hasilKirim = await kirimWa(ortuAsuh.noHp, pesan);

  await prisma.notifikasi.create({
    data: {
      ortuAsuhId,
      kanal: "WA",
      judul: "Laporan Penyaluran Dana",
      isi: pesan,
      tautan: url,
      terkirimAt: hasilKirim.terkirim ? new Date() : null,
    },
  });

  revalidatePath(`/admin/orangtua-asuh/${ortuAsuhId}`);

  if (!hasilKirim.terkirim) {
    return { sukses: false, pesan: `Tautan laporan dicatat tapi tidak terkirim: ${hasilKirim.alasan ?? "gagal mengirim"}.` };
  }
  return { sukses: true, pesan: "Tautan laporan berhasil dikirim via WA." };
}
