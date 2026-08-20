"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { KUNCI_PENGATURAN_NAMA_PENUH } from "@/server/queries/laporan";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function setFlagNamaPenuh(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const aktif = formData.get("aktif") === "on";

  await prisma.pengaturan.upsert({
    where: { kunci: KUNCI_PENGATURAN_NAMA_PENUH },
    update: { nilai: { aktif } },
    create: { kunci: KUNCI_PENGATURAN_NAMA_PENUH, nilai: { aktif } },
  });

  revalidatePath("/admin/pengaturan");
  return {
    sukses: true,
    pesan: aktif
      ? "Nama penuh mahasiswa sekarang ditampilkan di laporan penyaluran donatur."
      : "Laporan penyaluran donatur kembali disamarkan jadi inisial.",
  };
}
