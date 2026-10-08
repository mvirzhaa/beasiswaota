import { prisma } from "@/lib/db";

/**
 * Daftar mahasiswa untuk panel admin, dengan pencarian opsional (nama/NIM).
 * Default menyembunyikan yang statusProgram-nya bukan AKTIF (mundur/pindah ke
 * beasiswa lain) — set tampilkanKeluarProgram:true untuk menampilkan semua.
 */
export async function ambilDaftarMahasiswaAdmin(filter?: { cari?: string; tampilkanKeluarProgram?: boolean }) {
  const cari = filter?.cari?.trim();
  return prisma.mahasiswa.findMany({
    where: {
      ...(cari
        ? {
            OR: [
              { nama: { contains: cari, mode: "insensitive" as const } },
              { nim: { contains: cari, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(filter?.tampilkanKeluarProgram ? {} : { statusProgram: "AKTIF" }),
    },
    orderBy: { nama: "asc" },
  });
}

/** Jumlah mahasiswa yang sudah keluar program (mundur/pindah) — untuk badge toggle di admin. */
export async function hitungMahasiswaKeluarProgram() {
  return prisma.mahasiswa.count({ where: { statusProgram: { not: "AKTIF" } } });
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
