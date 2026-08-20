"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { tolakPesanSchema } from "@/lib/pembinaan/schema";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function teruskanPesan(pesanId: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const pesan = await prisma.pesanBinaan.findUnique({ where: { id: pesanId } });
  if (!pesan) {
    return { sukses: false, pesan: "Pesan tidak ditemukan." };
  }
  if (pesan.status !== "MENUNGGU_MODERASI") {
    return { sukses: false, pesan: "Pesan ini sudah diproses." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pesanBinaan.update({
      where: { id: pesanId },
      data: { status: "DITERUSKAN", moderatorId: admin.id, moderatedAt: new Date() },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "pesan_binaan.teruskan",
      entitas: "pesan_binaan",
      entitasId: pesanId,
      sebelum: { status: "MENUNGGU_MODERASI" },
      sesudah: { status: "DITERUSKAN" },
    });
  });

  revalidatePath("/admin/pesan");
  return { sukses: true, pesan: "Pesan diteruskan." };
}

export async function tolakPesan(pesanId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = tolakPesanSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Alasan wajib diisi." };
  }

  const pesan = await prisma.pesanBinaan.findUnique({ where: { id: pesanId } });
  if (!pesan) {
    return { sukses: false, pesan: "Pesan tidak ditemukan." };
  }
  if (pesan.status !== "MENUNGGU_MODERASI") {
    return { sukses: false, pesan: "Pesan ini sudah diproses." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pesanBinaan.update({
      where: { id: pesanId },
      data: {
        status: "DITOLAK",
        moderatorId: admin.id,
        moderatedAt: new Date(),
        alasanTolak: parsed.data.alasan,
      },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "pesan_binaan.tolak",
      entitas: "pesan_binaan",
      entitasId: pesanId,
      sebelum: { status: "MENUNGGU_MODERASI" },
      sesudah: { status: "DITOLAK", alasan: parsed.data.alasan },
    });
  });

  revalidatePath("/admin/pesan");
  return { sukses: true, pesan: "Pesan ditolak." };
}
