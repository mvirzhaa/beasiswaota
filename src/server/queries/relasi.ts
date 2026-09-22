import { prisma } from "@/lib/db";

// ============================================================================
// PRINSIP KERAS (CLAUDE.md aturan keras #10) — WAJIB dijaga di file ini:
//   "mahasiswa binaan saya" HANYA ditentukan dari tabel RelasiAsuh, TIDAK
//   PERNAH diturunkan dari AlokasiSumber/aliran dana.
// ============================================================================

/**
 * Field mahasiswa yang boleh dilihat donatur — TIDAK PERNAH noHp/alamat
 * (aturan keras #12). Diekspor supaya bisa ditest langsung tanpa DB: lihat
 * relasi.select.test.ts.
 */
export const SELECT_MAHASISWA_UNTUK_DONATUR = {
  id: true,
  nama: true,
  nim: true,
  prodi: true,
  fakultas: true,
} as const;

export async function ambilDaftarRelasiAdmin(filter?: { status?: string }) {
  return prisma.relasiAsuh.findMany({
    where: filter?.status ? { status: filter.status as never } : {},
    include: {
      ortuAsuh: { select: { nama: true, atasNamaMunfiq: true } },
      mahasiswa: { select: { nama: true, nim: true, prodi: true } },
      periodeMulai: { select: { kode: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function ambilOrtuAsuhUntukPenugasan() {
  return prisma.ortuAsuh.findMany({
    select: { id: true, nama: true, atasNamaMunfiq: true },
    orderBy: { nama: "asc" },
  });
}

export async function ambilMahasiswaUntukPenugasan() {
  return prisma.mahasiswa.findMany({
    where: { statusAkademik: "AKTIF" },
    select: { id: true, nama: true, nim: true, prodi: true },
    orderBy: { nama: "asc" },
  });
}

export async function ambilRelasiDetailAdmin(id: string) {
  return prisma.relasiAsuh.findUnique({
    where: { id },
    include: {
      ortuAsuh: { select: { id: true, nama: true, atasNamaMunfiq: true } },
      mahasiswa: { select: { id: true, nama: true, nim: true } },
    },
  });
}

/**
 * Halaman publik /laporan/{kodeAkses} (lihat src/app/(publik)/laporan).
 * Tidak ada lagi syarat persetujuan mahasiswa (mahasiswa tak punya akun
 * untuk menyetujui) — semua relasi aktif donatur ini ditampilkan lengkap.
 */
export interface BinaanTeridentifikasi {
  relasiId: string;
  mahasiswaId: string;
  nama: string;
  nim: string;
  prodi: string;
  ipkSeries: { periodeKode: string; ipk: number | null }[];
  laporanTerbaru: { periodeKode: string; status: string; isi: string } | null;
}

export async function ambilDaftarBinaanOrtuAsuh(
  ortuAsuhId: string,
): Promise<BinaanTeridentifikasi[]> {
  const relasiAktif = await prisma.relasiAsuh.findMany({
    where: { ortuAsuhId, status: "AKTIF" },
    select: { id: true, mahasiswaId: true },
  });

  const teridentifikasi: BinaanTeridentifikasi[] = [];
  for (const r of relasiAktif) {
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: r.mahasiswaId },
      select: SELECT_MAHASISWA_UNTUK_DONATUR,
    });
    if (!mahasiswa) continue;

    const monitoring = await prisma.monitoringAkademik.findMany({
      where: { mahasiswaId: r.mahasiswaId },
      select: { ipk: true, periode: { select: { kode: true, tglBuka: true } } },
      orderBy: { periode: { tglBuka: "asc" } },
    });

    const laporan = await prisma.laporanPerkembangan.findFirst({
      where: {
        mahasiswaId: r.mahasiswaId,
        bolehDibacaPembina: true,
        status: { in: ["DIKIRIM", "DIVERIFIKASI"] },
      },
      orderBy: { periode: { tglBuka: "desc" } },
      select: { isi: true, status: true, periode: { select: { kode: true } } },
    });

    teridentifikasi.push({
      relasiId: r.id,
      mahasiswaId: mahasiswa.id,
      nama: mahasiswa.nama,
      nim: mahasiswa.nim,
      prodi: mahasiswa.prodi,
      ipkSeries: monitoring.map((m) => ({
        periodeKode: m.periode.kode,
        ipk: m.ipk !== null ? Number(m.ipk) : null,
      })),
      laporanTerbaru: laporan
        ? { periodeKode: laporan.periode.kode, status: laporan.status, isi: laporan.isi }
        : null,
    });
  }

  return teridentifikasi;
}
