import { prisma } from "@/lib/db";
import type { UserSesi } from "@/lib/rbac-core";
import { hitungBatasKirimLaporan } from "@/lib/monitoring/batas-laporan";

/** Laporan satu mahasiswa untuk satu periode — dipakai form admin (/admin/mahasiswa). */
export async function ambilLaporanMahasiswa(mahasiswaId: string, periodeId: string) {
  return prisma.laporanPerkembangan.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId } },
  });
}

/** Riwayat laporan satu mahasiswa — dipakai halaman detail admin (/admin/mahasiswa/[id]). */
export async function ambilDaftarLaporanMahasiswa(mahasiswaId: string) {
  return prisma.laporanPerkembangan.findMany({
    where: { mahasiswaId },
    include: { periode: { select: { kode: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function ambilDaftarLaporanAdmin(filter?: { status?: string; periodeId?: string }) {
  return prisma.laporanPerkembangan.findMany({
    where: {
      ...(filter?.status ? { status: filter.status as never } : {}),
      ...(filter?.periodeId ? { periodeId: filter.periodeId } : {}),
    },
    include: {
      mahasiswa: { select: { nama: true, nim: true, fakultas: true, prodi: true } },
      periode: { select: { kode: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function ambilLaporanDetailAdmin(id: string) {
  return prisma.laporanPerkembangan.findUnique({
    where: { id },
    include: { mahasiswa: true, periode: true },
  });
}

export interface AksesLampiranLaporan {
  laporan: { id: string; lampiranKey: string | null };
}

/**
 * IDOR guard untuk lampiran laporan (scan KHS di bucket privat). Mahasiswa
 * dan donatur tidak punya akun/login (lihat CLAUDE.md) — satu-satunya sesi
 * yang mungkin ada di sistem ini adalah ADMIN.
 */
export async function cekAksesLampiranLaporan(
  laporanId: string,
  user: UserSesi,
): Promise<AksesLampiranLaporan | null> {
  if (user.role !== "ADMIN") return null;

  const laporan = await prisma.laporanPerkembangan.findUnique({
    where: { id: laporanId },
    select: { id: true, lampiranKey: true },
  });
  if (!laporan) return null;

  return { laporan: { id: laporan.id, lampiranKey: laporan.lampiranKey } };
}

export { hitungBatasKirimLaporan };
