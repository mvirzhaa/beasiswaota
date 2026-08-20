import { prisma } from "@/lib/db";

/** Periode yang layak dijalankan mesin alokasi — pendaftaran/DRAFT belum relevan, SELESAI terkunci. */
export async function ambilPeriodeUntukAlokasi() {
  return prisma.periode.findMany({
    where: { status: { in: ["SELEKSI", "PENYALURAN"] } },
    orderBy: { tglBuka: "desc" },
  });
}

/** Rincian satu batch alokasi: tiap penerima beserta sumber dananya (AlokasiSumber). */
export async function ambilBatchDetail(batchId: string) {
  return prisma.alokasi.findMany({
    where: { batchId },
    include: {
      periode: { select: { kode: true } },
      tagihan: {
        include: { mahasiswa: { select: { nama: true, nim: true, prodi: true } } },
      },
      sumber: {
        include: {
          transaksi: {
            include: { ortuAsuh: { select: { nama: true, atasNamaMunfiq: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
