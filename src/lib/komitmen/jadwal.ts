export type RitmeKomitmen = "PER_PERIODE" | "PER_BULAN";

export type GenerateJadwalKomitmen = {
  jumlahPeriode: number;
  ritme: RitmeKomitmen;
  nominalPerPeriode: bigint;
};

export type BarisJadwalRencana = {
  /** Periode ke berapa dalam jangka waktu komitmen ini, 1-based. */
  kePeriode: number;
  /** Urutan dalam satu periode: selalu 1 untuk PER_PERIODE, 1-6 untuk PER_BULAN. */
  urutan: number;
  nominal: bigint;
  jatuhTempo: Date;
};

const BULAN_PER_PERIODE = 6;

function tambahBulan(tanggal: Date, jumlahBulan: number): Date {
  return new Date(
    Date.UTC(tanggal.getUTCFullYear(), tanggal.getUTCMonth() + jumlahBulan, tanggal.getUTCDate()),
  );
}

/** Bagi rata bigint ke n bagian; sisa pembagian ditambahkan ke bagian terakhir, bukan dibulatkan tiap baris. */
function bagiRataDenganSisaDiAkhir(total: bigint, bagian: number): bigint[] {
  const dasar = total / BigInt(bagian);
  const sisa = total % BigInt(bagian);
  const hasil = Array.from({ length: bagian }, () => dasar);
  hasil[bagian - 1] = hasil[bagian - 1] + sisa;
  return hasil;
}

/**
 * Fungsi murni, tidak menyentuh DB: menghasilkan seluruh rencana jadwal
 * bayar untuk jumlahPeriode periode ke depan, dihitung dari
 * periodeAwal.tglBuka.
 *
 * Periode ke-2 dst memakai estimasi offset 6 bulan karena Periode aslinya
 * kemungkinan belum dibuat admin saat komitmen ini dibuat. Baris nyata untuk
 * periode tersebut dibuat lewat cron (Sesi 8) yang memanggil fungsi ini lagi
 * dengan periodeAwal = Periode sungguhan begitu periode itu ada, supaya
 * jatuh tempo tidak meleset dari estimasi.
 */
export function generateJadwal(
  komitmen: GenerateJadwalKomitmen,
  periodeAwal: { tglBuka: Date },
): BarisJadwalRencana[] {
  const baris: BarisJadwalRencana[] = [];

  for (let kePeriode = 1; kePeriode <= komitmen.jumlahPeriode; kePeriode += 1) {
    const anchorPeriode = tambahBulan(
      periodeAwal.tglBuka,
      (kePeriode - 1) * BULAN_PER_PERIODE,
    );

    if (komitmen.ritme === "PER_PERIODE") {
      baris.push({
        kePeriode,
        urutan: 1,
        nominal: komitmen.nominalPerPeriode,
        jatuhTempo: anchorPeriode,
      });
      continue;
    }

    const bagianBulanan = bagiRataDenganSisaDiAkhir(
      komitmen.nominalPerPeriode,
      BULAN_PER_PERIODE,
    );
    bagianBulanan.forEach((nominal, index) => {
      baris.push({
        kePeriode,
        urutan: index + 1,
        nominal,
        jatuhTempo: tambahBulan(anchorPeriode, index),
      });
    });
  }

  return baris;
}
