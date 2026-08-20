import { prisma } from "@/lib/db";
import { ambilOrtuAsuhIdUser } from "./komitmen";
import { ambilMahasiswaIdUser } from "./pengajuan";

// ============================================================================
// PRINSIP KERAS (CLAUDE.md aturan keras #10 & #11) — WAJIB dijaga di file ini:
//   - "mahasiswa binaan saya" HANYA ditentukan dari tabel RelasiAsuh, TIDAK
//     PERNAH diturunkan dari AlokasiSumber/aliran dana.
//   - Selama RelasiAsuh.persetujuanMahasiswa masih false, donatur hanya
//     boleh melihat AGREGAT tanpa identitas — dicek DI QUERY ini, bukan
//     disembunyikan di komponen UI.
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
 * Dashboard donatur (/donatur/binaan). Ini titik penegakan aturan keras #11:
 * relasi tanpa persetujuan mahasiswa TIDAK PERNAH mengembalikan identitas,
 * hanya masuk hitungan agregat.
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

export interface AgregatBinaanTanpaIdentitas {
  jumlah: number;
  rataRataIpkTerbaru: number | null;
}

export async function ambilDaftarBinaanOrtuAsuh(userId: string): Promise<{
  teridentifikasi: BinaanTeridentifikasi[];
  agregat: AgregatBinaanTanpaIdentitas;
}> {
  const ortuAsuhId = await ambilOrtuAsuhIdUser(userId);

  const relasiAktif = await prisma.relasiAsuh.findMany({
    where: { ortuAsuhId, status: "AKTIF" },
    select: { id: true, mahasiswaId: true, persetujuanMahasiswa: true },
  });

  const disetujui = relasiAktif.filter((r) => r.persetujuanMahasiswa);
  const belumSetuju = relasiAktif.filter((r) => !r.persetujuanMahasiswa);

  const teridentifikasi: BinaanTeridentifikasi[] = [];
  for (const r of disetujui) {
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

  let rataRataIpkTerbaru: number | null = null;
  if (belumSetuju.length > 0) {
    const nilaiIpk: number[] = [];
    for (const r of belumSetuju) {
      const terbaru = await prisma.monitoringAkademik.findFirst({
        where: { mahasiswaId: r.mahasiswaId },
        orderBy: { periode: { tglBuka: "desc" } },
        select: { ipk: true },
      });
      if (terbaru?.ipk !== null && terbaru?.ipk !== undefined) {
        nilaiIpk.push(Number(terbaru.ipk));
      }
    }
    if (nilaiIpk.length > 0) {
      rataRataIpkTerbaru = nilaiIpk.reduce((a, b) => a + b, 0) / nilaiIpk.length;
    }
  }

  return {
    teridentifikasi,
    agregat: { jumlah: belumSetuju.length, rataRataIpkTerbaru },
  };
}

/** Relasi yang ditugaskan ke mahasiswa yang sedang login — untuk halaman persetujuan. */
export async function ambilRelasiMahasiswa(userId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  return prisma.relasiAsuh.findMany({
    where: { mahasiswaId, status: "AKTIF" },
    select: {
      id: true,
      persetujuanMahasiswa: true,
      persetujuanAt: true,
      tglMulai: true,
      ortuAsuh: { select: { nama: true, atasNamaMunfiq: true, tipe: true, anonim: true } },
      periodeMulai: { select: { kode: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Cek kepemilikan sebelum mahasiswa menyetujui/menarik persetujuan (lapis ketiga RBAC). */
export async function ambilRelasiMilikMahasiswa(relasiId: string, userId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  const relasi = await prisma.relasiAsuh.findUnique({ where: { id: relasiId } });
  if (!relasi || relasi.mahasiswaId !== mahasiswaId) {
    return null;
  }
  return relasi;
}
