"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function tandaiBerkas(
  berkasId: string,
  status: "VALID" | "TIDAK_VALID",
  catatan?: string,
): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const berkas = await prisma.pengajuanBerkas.findUnique({
    where: { id: berkasId },
  });
  if (!berkas) {
    return { sukses: false, pesan: "Berkas tidak ditemukan." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengajuanBerkas.update({
      where: { id: berkasId },
      data: { status, catatan: catatan || null },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "pengajuan.tandai_berkas",
      entitas: "pengajuan_berkas",
      entitasId: berkasId,
      sebelum: { status: berkas.status },
      sesudah: { status },
    });
  });

  revalidatePath(`/admin/pengajuan/${berkas.pengajuanId}`);
  return { sukses: true, pesan: "Status berkas diperbarui." };
}

const skorSchema = z.coerce.number().min(0).max(100);

export async function setSkorManual(
  pengajuanId: string,
  skorInput: unknown,
): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = skorSchema.safeParse(skorInput);
  if (!parsed.success) {
    return { sukses: false, pesan: "Skor harus angka 0-100." };
  }

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
  });
  if (!pengajuan) {
    return { sukses: false, pesan: "Pengajuan tidak ditemukan." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id: pengajuanId },
      data: { skor: parsed.data },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "pengajuan.set_skor_manual",
      entitas: "pengajuan",
      entitasId: pengajuanId,
      sebelum: { skor: pengajuan.skor?.toString() ?? null },
      sesudah: { skor: parsed.data },
    });
  });

  revalidatePath(`/admin/pengajuan/${pengajuanId}`);
  return { sukses: true, pesan: "Skor tersimpan." };
}

export async function setujuiPengajuan(pengajuanId: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
  });
  if (!pengajuan) {
    return { sukses: false, pesan: "Pengajuan tidak ditemukan." };
  }
  if (pengajuan.status !== "DIAJUKAN" && pengajuan.status !== "VERIFIKASI_BERKAS") {
    return { sukses: false, pesan: "Pengajuan tidak dalam status yang bisa disetujui." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id: pengajuanId },
      data: {
        status: "DISETUJUI",
        verifiedById: admin.id,
        verifiedAt: new Date(),
      },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "pengajuan.setujui",
      entitas: "pengajuan",
      entitasId: pengajuanId,
      sebelum: { status: pengajuan.status },
      sesudah: { status: "DISETUJUI" },
    });
  });

  revalidatePath(`/admin/pengajuan/${pengajuanId}`);
  revalidatePath("/admin/pengajuan");
  return { sukses: true, pesan: "Pengajuan disetujui." };
}

const tolakSchema = z.object({
  catatan: z.string().min(5, "Catatan penolakan wajib diisi (minimal 5 karakter)"),
});

export async function tolakPengajuan(
  pengajuanId: string,
  input: unknown,
): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = tolakSchema.safeParse(input);
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: parsed.error.issues[0]?.message ?? "Catatan wajib diisi.",
    };
  }

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
  });
  if (!pengajuan) {
    return { sukses: false, pesan: "Pengajuan tidak ditemukan." };
  }
  if (pengajuan.status !== "DIAJUKAN" && pengajuan.status !== "VERIFIKASI_BERKAS") {
    return { sukses: false, pesan: "Pengajuan tidak dalam status yang bisa ditolak." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengajuan.update({
      where: { id: pengajuanId },
      data: {
        status: "DITOLAK",
        catatanVerifikator: parsed.data.catatan,
        verifiedById: admin.id,
        verifiedAt: new Date(),
      },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "pengajuan.tolak",
      entitas: "pengajuan",
      entitasId: pengajuanId,
      sebelum: { status: pengajuan.status },
      sesudah: { status: "DITOLAK", catatan: parsed.data.catatan },
    });
  });

  revalidatePath(`/admin/pengajuan/${pengajuanId}`);
  revalidatePath("/admin/pengajuan");
  return { sukses: true, pesan: "Pengajuan ditolak." };
}
