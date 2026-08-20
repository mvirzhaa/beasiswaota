import { Prisma, type PrismaClient } from "@prisma/client";
import { catatAudit } from "@/lib/audit";
import { hitungSaldo } from "@/lib/keuangan/ledger";

const SUDAH_DIPROSES = "SUDAH_DIPROSES";

export interface VerifikasiTransaksiIntiInput {
  transaksiId: string;
  periodeId: string;
  nominal: bigint;
  jadwalBayarId: string | null;
  /** null untuk verifikasi otomatis (webhook payment gateway / impor potong gaji) — bukan tindakan seorang admin. */
  verifiedById: string | null;
  keterangan: string;
  /** Aktor untuk AuditLog: null kalau sistem yang memicu (bukan klik admin). */
  aktorAuditId: string | null;
  aksiAudit: string;
  /** Timpa tglBayar dengan waktu penyelesaian sesungguhnya (mis. dari webhook), kalau ada. */
  tglBayarBaru?: Date;
}

export type HasilVerifikasiInti =
  | { sukses: true; saldoSetelah: bigint }
  | { sukses: false; kode: "SUDAH_DIPROSES" };

/**
 * Jalur SATU-SATUNYA yang menulis DanaLedger KREDIT dan menandai
 * Transaksi TERVERIFIKASI (CLAUDE.md aturan keras 1, 3, 6, 9) — dipakai
 * bareng oleh verifikasi manual admin (Sesi 5) dan webhook payment gateway
 * (Sesi 8), supaya kedua jalur benar-benar konsisten seperti diminta
 * PROMPT-CLAUDE-CODE.md: "memakai jalur kode yang sama dengan verifikasi
 * manual".
 *
 * Advisory lock per periode + update bersyarat where {id, status:
 * MENUNGGU_VERIFIKASI} mencegah double credit walau dipanggil konkuren
 * (dua admin, atau admin + webhook, atau webhook dikirim dobel).
 */
export async function verifikasiTransaksiInti(
  db: PrismaClient,
  input: VerifikasiTransaksiIntiInput,
): Promise<HasilVerifikasiInti> {
  try {
    const saldoSetelah = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(4711, hashtext(${input.periodeId}))`;

      try {
        await tx.transaksi.update({
          where: { id: input.transaksiId, status: "MENUNGGU_VERIFIKASI" },
          data: {
            status: "TERVERIFIKASI",
            verifiedById: input.verifiedById,
            verifiedAt: new Date(),
            ...(input.tglBayarBaru ? { tglBayar: input.tglBayarBaru } : {}),
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          throw new Error(SUDAH_DIPROSES);
        }
        throw error;
      }

      // Cek di dalam transaksi yang sama (terkunci per periode) apakah
      // jadwal ini ternyata sudah TERBAYAR dari Transaksi lain — bisa
      // terjadi kalau donatur memulai dua percobaan bayar untuk jadwal
      // yang sama. Uang yang masuk tetap WAJIB dikreditkan ke ledger
      // (aturan keras #4: pool harus akuntabel), tapi ditandai jelas
      // untuk ditinjau admin, bukan diam-diam ditolak atau di-double-count
      // sebagai pelunasan jadwal yang sama.
      const jadwalSaatIni = input.jadwalBayarId
        ? await tx.jadwalBayar.findUnique({
            where: { id: input.jadwalBayarId },
            select: { status: true },
          })
        : null;
      const sudahTerbayarSebelumnya = jadwalSaatIni?.status === "TERBAYAR";

      const saldoSebelum = await hitungSaldo(tx, input.periodeId);
      const saldoBaru = saldoSebelum + input.nominal;

      await tx.danaLedger.create({
        data: {
          periodeId: input.periodeId,
          tipe: "KREDIT",
          nominal: input.nominal,
          saldoSetelah: saldoBaru,
          transaksiId: input.transaksiId,
          keterangan: sudahTerbayarSebelumnya
            ? `${input.keterangan} — PERHATIAN: jadwal ini sudah TERBAYAR sebelumnya, kemungkinan pembayaran ganda, perlu ditinjau admin`
            : input.keterangan,
        },
      });

      if (input.jadwalBayarId && !sudahTerbayarSebelumnya) {
        await tx.jadwalBayar.update({
          where: { id: input.jadwalBayarId },
          data: { status: "TERBAYAR" },
        });
      }

      await catatAudit(tx, {
        aktorId: input.aktorAuditId,
        aksi: input.aksiAudit,
        entitas: "transaksi",
        entitasId: input.transaksiId,
        sebelum: { status: "MENUNGGU_VERIFIKASI" },
        sesudah: { status: "TERVERIFIKASI", saldoSetelah: saldoBaru.toString() },
      });

      return saldoBaru;
    });

    return { sukses: true, saldoSetelah };
  } catch (error) {
    if (error instanceof Error && error.message === SUDAH_DIPROSES) {
      return { sukses: false, kode: "SUDAH_DIPROSES" };
    }
    throw error;
  }
}
