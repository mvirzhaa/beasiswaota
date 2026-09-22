import { prisma } from "@/lib/db";

/**
 * Daftar donatur untuk panel admin. Setiap donatur otomatis masuk ke sini
 * begitu form publik /register disubmit (satu OrtuAsuh + satu Komitmen
 * dibuat bersamaan) — tidak ada langkah aktivasi/persetujuan terpisah untuk
 * datanya muncul di daftar ini.
 */
export async function ambilDaftarOrtuAsuhAdmin(filter: { cari?: string } = {}) {
  return prisma.ortuAsuh.findMany({
    where: filter.cari
      ? {
          OR: [
            { nama: { contains: filter.cari, mode: "insensitive" } },
            { atasNamaMunfiq: { contains: filter.cari, mode: "insensitive" } },
            { noHp: { contains: filter.cari } },
          ],
        }
      : undefined,
    include: {
      komitmen: { select: { id: true, status: true, nominalPerPeriode: true } },
      _count: { select: { relasiAsuh: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Riwayat notifikasi (WA/email) yang pernah dikirim ke donatur ini, terbaru dulu. */
export async function ambilNotifikasiOrtuAsuh(ortuAsuhId: string, limit = 10) {
  return prisma.notifikasi.findMany({
    where: { ortuAsuhId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function ambilOrtuAsuhDetailAdmin(id: string) {
  return prisma.ortuAsuh.findUnique({
    where: { id },
    include: {
      komitmen: {
        orderBy: { createdAt: "desc" },
        include: { targetMahasiswa: { select: { nama: true, nim: true } } },
      },
      transaksi: {
        orderBy: { tglBayar: "desc" },
        select: { id: true, nominal: true, status: true, metode: true, tglBayar: true },
      },
      relasiAsuh: {
        where: { status: "AKTIF" },
        include: { mahasiswa: { select: { id: true, nama: true, nim: true, prodi: true } } },
      },
    },
  });
}
