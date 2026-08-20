import { prisma } from "@/lib/db";
import type { UserSesi } from "@/lib/rbac-core";
import { ambilMahasiswaIdUser } from "./pengajuan";

/** Relasi yang layak dikirimi pesan dari sisi donatur: AKTIF + sudah disetujui mahasiswa. */
export async function ambilRelasiUntukPesanOrtuAsuh(userId: string) {
  const ortuAsuh = await prisma.ortuAsuh.findUnique({ where: { userId } });
  if (!ortuAsuh) return [];
  return prisma.relasiAsuh.findMany({
    where: { ortuAsuhId: ortuAsuh.id, status: "AKTIF", persetujuanMahasiswa: true },
    select: { id: true, mahasiswa: { select: { nama: true, nim: true } } },
  });
}

export async function ambilRelasiUntukPesanMahasiswa(userId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  return prisma.relasiAsuh.findMany({
    where: { mahasiswaId, status: "AKTIF", persetujuanMahasiswa: true },
    select: {
      id: true,
      ortuAsuh: { select: { nama: true, atasNamaMunfiq: true, anonim: true } },
    },
  });
}

/** Cek kepemilikan + kelayakan relasi sebelum boleh mengirim pesan (dipanggil di action, bukan di UI). */
export async function ambilRelasiUntukKirimPesan(relasiId: string, userId: string) {
  const relasi = await prisma.relasiAsuh.findUnique({
    where: { id: relasiId },
    select: {
      id: true,
      status: true,
      persetujuanMahasiswa: true,
      ortuAsuh: { select: { userId: true } },
      mahasiswa: { select: { userId: true } },
    },
  });
  if (!relasi) return null;
  if (relasi.status !== "AKTIF" || !relasi.persetujuanMahasiswa) return null;

  const pemilik = relasi.ortuAsuh.userId === userId || relasi.mahasiswa.userId === userId;
  if (!pemilik) return null;

  return relasi;
}

/**
 * Thread pesan satu relasi, DISARING per penerima: tiap orang selalu boleh
 * lihat pesan yang DIA kirim sendiri (apa pun statusnya, supaya tahu masih
 * menunggu moderasi atau ditolak), tapi pesan dari LAWAN bicara hanya
 * tampil kalau sudah DITERUSKAN — MENUNGGU_MODERASI/DITOLAK milik orang
 * lain tidak boleh bocor.
 */
export async function ambilPesanRelasiUntukUser(relasiId: string, user: UserSesi) {
  const relasi = await prisma.relasiAsuh.findUnique({
    where: { id: relasiId },
    select: {
      id: true,
      ortuAsuh: { select: { userId: true, nama: true, atasNamaMunfiq: true } },
      mahasiswa: { select: { userId: true, nama: true } },
    },
  });
  if (!relasi) return null;

  const pemilik = relasi.ortuAsuh.userId === user.id || relasi.mahasiswa.userId === user.id;
  if (!pemilik && user.role !== "ADMIN") return null;

  const semuaPesan = await prisma.pesanBinaan.findMany({
    where: { relasiAsuhId: relasiId },
    orderBy: { createdAt: "asc" },
  });

  const pesan =
    user.role === "ADMIN"
      ? semuaPesan
      : semuaPesan.filter((p) => p.pengirimId === user.id || p.status === "DITERUSKAN");

  return { relasi, pesan };
}

/** Antrian moderasi untuk panel admin. */
export async function ambilAntrianModerasiPesan() {
  return prisma.pesanBinaan.findMany({
    where: { status: "MENUNGGU_MODERASI" },
    include: {
      relasiAsuh: {
        select: {
          ortuAsuh: { select: { nama: true } },
          mahasiswa: { select: { nama: true, nim: true } },
        },
      },
      pengirim: { select: { role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
