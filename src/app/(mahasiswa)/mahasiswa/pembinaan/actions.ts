"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { ambilRelasiMilikMahasiswa } from "@/server/queries/relasi";
import type { HasilAksi } from "@/types/aksi";

async function sesiMahasiswa() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MAHASISWA") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

/**
 * Mengubah HANYA RelasiAsuh.persetujuanMahasiswa/persetujuanAt. Sengaja
 * tidak menyentuh tabel lain sama sekali — CLAUDE.md aturan keras #11
 * mewajibkan menarik persetujuan tidak boleh berdampak ke status
 * pengajuan atau alokasi apa pun.
 */
export async function setujuiPembinaan(relasiId: string): Promise<HasilAksi> {
  const user = await sesiMahasiswa();

  const relasi = await ambilRelasiMilikMahasiswa(relasiId, user.id);
  if (!relasi) {
    return { sukses: false, pesan: "Relasi tidak ditemukan." };
  }
  if (relasi.status !== "AKTIF") {
    return { sukses: false, pesan: "Relasi ini tidak lagi aktif." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.relasiAsuh.update({
      where: { id: relasiId },
      data: { persetujuanMahasiswa: true, persetujuanAt: new Date() },
    });
    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "relasi.setujui_pemantauan",
      entitas: "relasi_asuh",
      entitasId: relasiId,
      sebelum: { persetujuanMahasiswa: relasi.persetujuanMahasiswa },
      sesudah: { persetujuanMahasiswa: true },
    });
  });

  revalidatePath("/mahasiswa/pembinaan");
  return { sukses: true, pesan: "Persetujuan pemantauan diberikan." };
}

export async function tarikPersetujuanPembinaan(relasiId: string): Promise<HasilAksi> {
  const user = await sesiMahasiswa();

  const relasi = await ambilRelasiMilikMahasiswa(relasiId, user.id);
  if (!relasi) {
    return { sukses: false, pesan: "Relasi tidak ditemukan." };
  }
  if (relasi.status !== "AKTIF") {
    return { sukses: false, pesan: "Relasi ini tidak lagi aktif." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.relasiAsuh.update({
      where: { id: relasiId },
      data: { persetujuanMahasiswa: false, persetujuanAt: null },
    });
    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "relasi.tarik_persetujuan",
      entitas: "relasi_asuh",
      entitasId: relasiId,
      sebelum: { persetujuanMahasiswa: relasi.persetujuanMahasiswa },
      sesudah: { persetujuanMahasiswa: false },
    });
  });

  revalidatePath("/mahasiswa/pembinaan");
  return {
    sukses: true,
    pesan: "Persetujuan ditarik. Beasiswa dan pengajuan Anda tidak terpengaruh.",
  };
}
