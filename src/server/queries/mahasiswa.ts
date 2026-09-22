import { prisma } from "@/lib/db";

/** Daftar mahasiswa untuk panel admin, dengan pencarian opsional (nama/NIM). */
export async function ambilDaftarMahasiswaAdmin(filter?: { cari?: string }) {
  const cari = filter?.cari?.trim();
  return prisma.mahasiswa.findMany({
    where: cari
      ? {
          OR: [
            { nama: { contains: cari, mode: "insensitive" } },
            { nim: { contains: cari, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { nama: "asc" },
  });
}

export async function ambilMahasiswaDetailAdmin(id: string) {
  return prisma.mahasiswa.findUnique({ where: { id } });
}

/** Periode yang punya Pengajuan/LaporanPerkembangan untuk mahasiswa ini, untuk dropdown admin. */
export async function ambilPeriodeUntukAdminMahasiswa() {
  return prisma.periode.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: { tglBuka: "desc" },
  });
}
