import { prisma } from "@/lib/db";
import type { UserSesi } from "@/lib/rbac-core";
import { hitungBatasKirimLaporan } from "@/lib/monitoring/batas-laporan";
import { ambilMahasiswaIdUser } from "./pengajuan";

/** Periode di mana mahasiswa yang login berstatus penerima (Pengajuan DISETUJUI). */
export async function ambilPeriodePenerimaMahasiswa(userId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  const pengajuan = await prisma.pengajuan.findMany({
    where: { mahasiswaId, status: "DISETUJUI" },
    select: { periode: true },
    orderBy: { periode: { tglBuka: "desc" } },
  });
  return pengajuan.map((p) => p.periode);
}

export async function ambilLaporanMahasiswa(userId: string, periodeId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  return prisma.laporanPerkembangan.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId } },
  });
}

export async function ambilDaftarLaporanMahasiswa(userId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  return prisma.laporanPerkembangan.findMany({
    where: { mahasiswaId },
    include: { periode: { select: { kode: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Cek kepemilikan sebelum mahasiswa membuat/mengubah laporannya sendiri. */
export async function ambilLaporanMilikMahasiswa(laporanId: string, userId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  const laporan = await prisma.laporanPerkembangan.findUnique({ where: { id: laporanId } });
  if (!laporan || laporan.mahasiswaId !== mahasiswaId) return null;
  return laporan;
}

export interface PeringatanLaporan {
  perluDiingatkan: boolean;
  periodeBelumLaporan: string | null;
}

/**
 * Laporan jadi syarat perpanjangan: kalau laporan periode terakhir mahasiswa
 * jadi penerima belum DIVERIFIKASI, dan sudah ada periode berikutnya yang
 * dibuka (status apa pun selain DRAFT), tampilkan peringatan di dashboard.
 */
export async function ambilPeringatanLaporan(userId: string): Promise<PeringatanLaporan> {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);

  const periodePenerima = await prisma.pengajuan.findMany({
    where: { mahasiswaId, status: "DISETUJUI" },
    select: { periode: true },
    orderBy: { periode: { tglBuka: "desc" } },
  });
  if (periodePenerima.length === 0) {
    return { perluDiingatkan: false, periodeBelumLaporan: null };
  }

  const periodeTerakhir = periodePenerima[0].periode;

  const laporan = await prisma.laporanPerkembangan.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId: periodeTerakhir.id } },
    select: { status: true },
  });
  if (laporan?.status === "DIVERIFIKASI") {
    return { perluDiingatkan: false, periodeBelumLaporan: null };
  }

  const adaPeriodeBerikutnyaDibuka = await prisma.periode.findFirst({
    where: {
      tglBuka: { gt: periodeTerakhir.tglBuka },
      status: { not: "DRAFT" },
    },
  });

  return {
    perluDiingatkan: adaPeriodeBerikutnyaDibuka !== null,
    periodeBelumLaporan: adaPeriodeBerikutnyaDibuka !== null ? periodeTerakhir.kode : null,
  };
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
 * IDOR guard untuk lampiran laporan (scan KHS di bucket privat). Boleh
 * diakses: ADMIN, mahasiswa pemilik laporan, atau donatur pembinanya YANG
 * relasinya AKTIF + persetujuanMahasiswa true + bolehDibacaPembina true
 * pada laporan yang sudah DIKIRIM/DIVERIFIKASI (bukan draft).
 */
export async function cekAksesLampiranLaporan(
  laporanId: string,
  user: UserSesi,
): Promise<AksesLampiranLaporan | null> {
  const laporan = await prisma.laporanPerkembangan.findUnique({
    where: { id: laporanId },
    select: {
      id: true,
      lampiranKey: true,
      status: true,
      bolehDibacaPembina: true,
      mahasiswaId: true,
      mahasiswa: { select: { userId: true } },
    },
  });
  if (!laporan) return null;

  if (user.role === "ADMIN" || laporan.mahasiswa.userId === user.id) {
    return { laporan: { id: laporan.id, lampiranKey: laporan.lampiranKey } };
  }

  if (user.role === "ORTU_ASUH") {
    if (laporan.status === "DRAFT" || !laporan.bolehDibacaPembina) return null;
    const ortuAsuh = await prisma.ortuAsuh.findUnique({ where: { userId: user.id } });
    if (!ortuAsuh) return null;
    const relasi = await prisma.relasiAsuh.findFirst({
      where: {
        ortuAsuhId: ortuAsuh.id,
        mahasiswaId: laporan.mahasiswaId,
        status: "AKTIF",
        persetujuanMahasiswa: true,
      },
    });
    if (!relasi) return null;
    return { laporan: { id: laporan.id, lampiranKey: laporan.lampiranKey } };
  }

  return null;
}

export { hitungBatasKirimLaporan };
