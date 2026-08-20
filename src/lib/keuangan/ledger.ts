import type { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Saldo pool suatu periode = saldoSetelah entri DanaLedger TERAKHIR untuk
 * periode itu — bukan hasil menjumlah tabel Transaksi. Transaksi yang
 * belum diverifikasi tidak boleh ikut terhitung, dan Transaksi sendiri
 * tidak punya periodeId langsung (lihat catatan di engine.ts); satu-satunya
 * sumber kebenaran saldo adalah baris yang sudah ditulis ke ledger.
 *
 * Selalu panggil ini di dalam transaksi yang sudah memegang
 * pg_advisory_xact_lock(4711, hashtext(periodeId)) sebelum menulis entri
 * ledger baru, supaya saldoSetelah antar entri tidak pernah balapan.
 */
export async function hitungSaldo(tx: TxClient, periodeId: string): Promise<bigint> {
  const ledgerTerakhir = await tx.danaLedger.findFirst({
    where: { periodeId },
    orderBy: { createdAt: "desc" },
  });
  return ledgerTerakhir?.saldoSetelah ?? 0n;
}
