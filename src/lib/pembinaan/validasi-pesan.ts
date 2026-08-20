export interface HasilValidasiPesan {
  diizinkan: boolean;
  alasan?: string;
}

const POLA_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
// 8+ digit berurutan, boleh diselingi spasi/strip/titik/kurung di antara
// tiap digit (sepanjang yang menyela hanya karakter pemisah itu, bukan
// huruf) — menangkap pola umum nomor telepon Indonesia (081234567890,
// 0812-3456-7890, (021) 555-1234, dst) tanpa memicu false positive pada
// dua angka pendek yang kebetulan muncul di kalimat berbeda.
const POLA_TELEPON = /(?:\d[\s\-().]*){8,}\d/;

/**
 * Fungsi murni: tidak ada pertukaran kontak langsung donatur <-> mahasiswa
 * (CLAUDE.md aturan keras #12) — pesan yang mengandung pola email atau
 * nomor telepon diblokir sebelum masuk antrian moderasi.
 */
export function cekKontakTerlarang(isi: string): HasilValidasiPesan {
  if (POLA_EMAIL.test(isi)) {
    return {
      diizinkan: false,
      alasan: "Pesan tidak boleh mengandung alamat email. Komunikasi kontak langsung tidak diizinkan.",
    };
  }
  if (POLA_TELEPON.test(isi)) {
    return {
      diizinkan: false,
      alasan: "Pesan tidak boleh mengandung nomor telepon. Komunikasi kontak langsung tidak diizinkan.",
    };
  }
  return { diizinkan: true };
}
