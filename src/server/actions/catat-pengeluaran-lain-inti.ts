import type { PrismaClient } from "@prisma/client";
import { catatAudit } from "@/lib/audit";
import { hitungSaldo } from "@/lib/keuangan/ledger";
import { formatRupiah } from "@/lib/uang";

export interface CatatPengeluaranLainIntiInput {
  periodeId: string;
  nominal: bigint;
  keterangan: string;
  dicatatOlehId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export type HasilCatatPengeluaranLainInti =
  | { sukses: true; pengeluaranId: string; saldoSetelah: bigint }
  | { sukses: false; pesan: string };

/**
 * Jalur SATU-SATUNYA yang menulis DanaLedger DEBIT untuk dana yang terpakai
 * di luar sistem alokasi (CLAUDE.md aturan keras 1, 4, 6, 9) — mis. biaya
 * operasional atau refund ke donatur. Sengaja TIDAK lewat Alokasi/
 * AlokasiSumber (aturan keras #2: pool -> mahasiswa tetap harus lewat mesin
 * alokasi; ini jalur terpisah untuk dana yang memang tidak menuju mahasiswa).
 *
 * Advisory lock per periode (sama dengan verifikasiTransaksiInti) supaya
 * saldoSetelah tidak pernah balapan dengan penulisan ledger lain di periode
 * yang sama, dan pool tidak pernah didebit sampai negatif.
 */
export async function catatPengeluaranLainInti(
  db: PrismaClient,
  input: CatatPengeluaranLainIntiInput,
): Promise<HasilCatatPengeluaranLainInti> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(4711, hashtext(${input.periodeId}))`;

    const saldoSebelum = await hitungSaldo(tx, input.periodeId);
    if (saldoSebelum < input.nominal) {
      return {
        sukses: false,
        pesan: `Saldo pool periode ini tidak cukup (saldo saat ini: ${formatRupiah(saldoSebelum)}, dibutuhkan ${formatRupiah(input.nominal)}).`,
      } as const;
    }
    const saldoBaru = saldoSebelum - input.nominal;

    const pengeluaran = await tx.pengeluaranLain.create({
      data: {
        periodeId: input.periodeId,
        nominal: input.nominal,
        keterangan: input.keterangan,
        dicatatOlehId: input.dicatatOlehId,
      },
    });

    await tx.danaLedger.create({
      data: {
        periodeId: input.periodeId,
        tipe: "DEBIT",
        nominal: input.nominal,
        saldoSetelah: saldoBaru,
        pengeluaranLainId: pengeluaran.id,
        keterangan: `Pengeluaran di luar sistem: ${input.keterangan}`,
      },
    });

    await catatAudit(tx, {
      aktorId: input.dicatatOlehId,
      aksi: "pengeluaran_lain.catat",
      entitas: "pengeluaran_lain",
      entitasId: pengeluaran.id,
      sesudah: {
        periodeId: input.periodeId,
        nominal: input.nominal.toString(),
        keterangan: input.keterangan,
        saldoSetelah: saldoBaru.toString(),
      },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return { sukses: true, pengeluaranId: pengeluaran.id, saldoSetelah: saldoBaru } as const;
  });
}
