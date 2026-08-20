"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { reviewLaporanSchema } from "@/lib/monitoring/laporan.schema";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function verifikasiLaporan(laporanId: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const laporan = await prisma.laporanPerkembangan.findUnique({ where: { id: laporanId } });
  if (!laporan) {
    return { sukses: false, pesan: "Laporan tidak ditemukan." };
  }
  if (laporan.status !== "DIKIRIM") {
    return { sukses: false, pesan: "Hanya laporan berstatus DIKIRIM yang bisa diverifikasi." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.laporanPerkembangan.update({
      where: { id: laporanId },
      data: { status: "DIVERIFIKASI", reviewedById: admin.id, reviewedAt: new Date(), catatanReview: null },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "laporan.verifikasi",
      entitas: "laporan_perkembangan",
      entitasId: laporanId,
      sebelum: { status: "DIKIRIM" },
      sesudah: { status: "DIVERIFIKASI" },
    });
  });

  revalidatePath(`/admin/laporan/${laporanId}`);
  revalidatePath("/admin/laporan");
  return { sukses: true, pesan: "Laporan diverifikasi." };
}

export async function mintaRevisiLaporan(laporanId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = reviewLaporanSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Catatan wajib diisi." };
  }

  const laporan = await prisma.laporanPerkembangan.findUnique({ where: { id: laporanId } });
  if (!laporan) {
    return { sukses: false, pesan: "Laporan tidak ditemukan." };
  }
  if (laporan.status !== "DIKIRIM") {
    return { sukses: false, pesan: "Hanya laporan berstatus DIKIRIM yang bisa diminta revisi." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.laporanPerkembangan.update({
      where: { id: laporanId },
      data: {
        status: "PERLU_REVISI",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        catatanReview: parsed.data.catatan,
      },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "laporan.minta_revisi",
      entitas: "laporan_perkembangan",
      entitasId: laporanId,
      sebelum: { status: "DIKIRIM" },
      sesudah: { status: "PERLU_REVISI", catatan: parsed.data.catatan },
    });
  });

  revalidatePath(`/admin/laporan/${laporanId}`);
  revalidatePath("/admin/laporan");
  return { sukses: true, pesan: "Mahasiswa diminta merevisi laporan." };
}
