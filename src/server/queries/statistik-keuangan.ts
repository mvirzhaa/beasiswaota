import { prisma } from "@/lib/db";

export interface StatistikKeuangan {
  totalPemasukan: bigint;
  totalPengeluaran: bigint;
  surplus: bigint;
}

/**
 * Ringkasan pemasukan (KREDIT) vs pengeluaran (DEBIT) dari DanaLedger —
 * ledger running-balance yang sama dipakai untuk audit, jadi angka ini
 * konsisten dengan yang tercatat per mutasi. Dipakai kartu statistik di
 * dashboard admin, bukan untuk perhitungan keuangan apa pun (hanya tampilan).
 */
export async function ambilStatistikKeuangan(): Promise<StatistikKeuangan> {
  const [kredit, debit] = await Promise.all([
    prisma.danaLedger.aggregate({ where: { tipe: "KREDIT" }, _sum: { nominal: true } }),
    prisma.danaLedger.aggregate({ where: { tipe: "DEBIT" }, _sum: { nominal: true } }),
  ]);

  const totalPemasukan = kredit._sum.nominal ?? 0n;
  const totalPengeluaran = debit._sum.nominal ?? 0n;

  return {
    totalPemasukan,
    totalPengeluaran,
    surplus: totalPemasukan - totalPengeluaran,
  };
}
