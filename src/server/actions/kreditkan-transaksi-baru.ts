import { Prisma, type PrismaClient, type MekanismePenyaluran } from "@prisma/client";
import { catatAudit } from "@/lib/audit";
import { hitungSaldo } from "@/lib/keuangan/ledger";

export interface KreditkanTransaksiBaruInput {
  ortuAsuhId: string;
  komitmenId: string | null;
  jadwalBayarId: string | null;
  nominal: bigint;
  metode: MekanismePenyaluran;
  refEksternal: string;
  tglBayar: Date;
  periodeId: string;
  keterangan: string;
  aktorAuditId: string | null;
  aksiAudit: string;
}

export type HasilKreditkanTransaksiBaru =
  | { sukses: true; transaksiId: string }
  | { sukses: false; kode: "REF_DUPLIKAT" };

/**
 * Untuk sumber dana yang statusnya SUDAH final saat dicatat (potong gaji
 * yang sudah terpotong dari payroll) — beda dari verifikasiTransaksiInti
 * yang mem-flip Transaksi MENUNGGU_VERIFIKASI yang sudah ada. Transaksi
 * langsung dibuat TERVERIFIKASI + kredit ledger dalam satu transaksi DB
 * terkunci per periode (aturan keras #1, #6, #9).
 *
 * Idempoten lewat unique constraint Transaksi.refEksternal — kalau baris
 * yang sama diimpor dua kali (refEksternal sama), percobaan kedua gagal
 * bersih tanpa double credit.
 */
export async function kreditkanTransaksiBaru(
  db: PrismaClient,
  input: KreditkanTransaksiBaruInput,
): Promise<HasilKreditkanTransaksiBaru> {
  try {
    const transaksiId = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(4711, hashtext(${input.periodeId}))`;

      const dibuat = await tx.transaksi.create({
        data: {
          ortuAsuhId: input.ortuAsuhId,
          komitmenId: input.komitmenId,
          jadwalBayarId: input.jadwalBayarId,
          nominal: input.nominal,
          metode: input.metode,
          refEksternal: input.refEksternal,
          status: "TERVERIFIKASI",
          tglBayar: input.tglBayar,
          verifiedAt: new Date(),
        },
      });

      const saldoSebelum = await hitungSaldo(tx, input.periodeId);
      const saldoBaru = saldoSebelum + input.nominal;

      await tx.danaLedger.create({
        data: {
          periodeId: input.periodeId,
          tipe: "KREDIT",
          nominal: input.nominal,
          saldoSetelah: saldoBaru,
          transaksiId: dibuat.id,
          keterangan: input.keterangan,
        },
      });

      if (input.jadwalBayarId) {
        await tx.jadwalBayar.update({
          where: { id: input.jadwalBayarId },
          data: { status: "TERBAYAR" },
        });
      }

      await catatAudit(tx, {
        aktorId: input.aktorAuditId,
        aksi: input.aksiAudit,
        entitas: "transaksi",
        entitasId: dibuat.id,
        sesudah: { nominal: input.nominal.toString(), refEksternal: input.refEksternal },
      });

      return dibuat.id;
    });

    return { sukses: true, transaksiId };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { sukses: false, kode: "REF_DUPLIKAT" };
    }
    throw error;
  }
}
