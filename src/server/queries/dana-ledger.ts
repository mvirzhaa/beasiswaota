import { prisma } from "@/lib/db";

export interface BarisMutasiDana {
  id: string;
  tipe: "KREDIT" | "DEBIT";
  nominal: bigint;
  saldoSetelah: bigint;
  createdAt: Date;
  periodeKode: string;
  /** Sumber (KREDIT) atau tujuan (DEBIT) dana, sudah dalam bentuk teks siap tampil. */
  pihak: string;
  keterangan: string;
}

/**
 * Riwayat mutasi dana terbaru (pemasukan & pengeluaran digabung satu linimasa)
 * untuk halaman Pemasukan & Pengeluaran — ledger yang sama dipakai audit,
 * jadi angkanya konsisten dengan yang tercatat per transaksi/alokasi.
 */
export async function ambilMutasiDanaTerbaru(limit = 30): Promise<BarisMutasiDana[]> {
  const baris = await prisma.danaLedger.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      periode: { select: { kode: true } },
      transaksi: { select: { ortuAsuh: { select: { nama: true, atasNamaMunfiq: true } } } },
      alokasi: {
        select: {
          tagihan: { select: { komponen: true, mahasiswa: { select: { nama: true } } } },
        },
      },
      pengeluaranLain: { select: { keterangan: true } },
    },
  });

  return baris.map((b) => {
    const pihak =
      b.tipe === "KREDIT"
        ? (b.transaksi?.ortuAsuh.atasNamaMunfiq || b.transaksi?.ortuAsuh.nama || "Donatur")
        : (b.alokasi?.tagihan.mahasiswa.nama ?? (b.pengeluaranLain ? "Di luar sistem" : "Mahasiswa"));

    const keterangan =
      b.tipe === "KREDIT"
        ? "Dana masuk terverifikasi"
        : b.alokasi
          ? `Alokasi ${b.alokasi.tagihan.komponen}`
          : (b.pengeluaranLain?.keterangan ?? "Pengeluaran di luar sistem");

    return {
      id: b.id,
      tipe: b.tipe,
      nominal: b.nominal,
      saldoSetelah: b.saldoSetelah,
      createdAt: b.createdAt,
      periodeKode: b.periode.kode,
      pihak,
      keterangan,
    };
  });
}
