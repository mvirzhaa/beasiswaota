"use server";

import { revalidatePath } from "next/cache";
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

export async function konfirmasiKomitmen(komitmenId: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const komitmen = await prisma.komitmen.findUnique({ where: { id: komitmenId } });
  if (!komitmen) {
    return { sukses: false, pesan: "Komitmen tidak ditemukan." };
  }
  if (komitmen.status !== "MENUNGGU_KONFIRMASI") {
    return { sukses: false, pesan: "Komitmen ini tidak dalam status menunggu konfirmasi." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.komitmen.update({
      where: { id: komitmenId },
      data: { status: "AKTIF" },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "komitmen.konfirmasi",
      entitas: "komitmen",
      entitasId: komitmenId,
      sebelum: { status: komitmen.status },
      sesudah: { status: "AKTIF" },
    });
  });

  revalidatePath("/admin/komitmen");
  return { sukses: true, pesan: "Komitmen dikonfirmasi dan sekarang aktif." };
}
