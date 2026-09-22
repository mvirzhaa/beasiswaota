import { prisma } from "@/lib/db";

export interface RingkasanDashboardAdmin {
  mahasiswaAktif: number;
  ortuAsuhTerdaftar: number;
  transaksiMenunggu: number;
  komitmenMenunggu: number;
  batchSiapDisetujui: number;
}

/** Ringkasan angka untuk dashboard admin — tiap query murah (count/groupBy), aman dipanggil tiap load. */
export async function ambilRingkasanDashboardAdmin(): Promise<RingkasanDashboardAdmin> {
  const [mahasiswaAktif, ortuAsuhTerdaftar, transaksiMenunggu, komitmenMenunggu, batchDraft] =
    await Promise.all([
      prisma.mahasiswa.count({ where: { statusAkademik: "AKTIF" } }),
      prisma.ortuAsuh.count(),
      prisma.transaksi.count({ where: { status: "MENUNGGU_VERIFIKASI" } }),
      prisma.komitmen.count({ where: { status: "MENUNGGU_KONFIRMASI" } }),
      prisma.alokasi.groupBy({ by: ["batchId"], where: { status: "DRAFT", batchId: { not: null } } }),
    ]);

  return {
    mahasiswaAktif,
    ortuAsuhTerdaftar,
    transaksiMenunggu,
    komitmenMenunggu,
    batchSiapDisetujui: batchDraft.length,
  };
}
