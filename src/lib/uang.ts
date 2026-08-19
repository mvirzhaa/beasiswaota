// Uang selalu BigInt, satuan Rupiah penuh, tanpa sen. Format ke string hanya
// terjadi di sini, di lapisan tampilan — jangan pernah pakai number/parseFloat
// di jalur perhitungan nominal.

const FORMATTER_RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format BigInt Rupiah ke string tampilan, mis. 1500000n -> "Rp1.500.000".
 */
export function formatRupiah(nominal: bigint): string {
  // Intl menyisipkan spasi (termasuk non-breaking space) antara "Rp" dan
  // angka tergantung data ICU yang terpasang di runtime. Normalisasi ke
  // format tanpa spasi ("Rp1.500.000") supaya tampilannya konsisten.
  return FORMATTER_RUPIAH.format(nominal).replace(/^Rp\s+/, "Rp");
}

/**
 * Parse string input pengguna (mis. "Rp1.500.000", "1.500.000", "1500000")
 * ke BigInt Rupiah. Melempar error kalau format tidak valid.
 */
export function parseRupiah(input: string): bigint {
  const dibersihkan = input
    .trim()
    .replace(/^Rp\s?/i, "")
    .replace(/[.\s]/g, "")
    .replace(/,00?$/, "");

  if (dibersihkan === "" || !/^-?\d+$/.test(dibersihkan)) {
    throw new Error(`Nominal Rupiah tidak valid: "${input}"`);
  }

  const nilai = BigInt(dibersihkan);
  if (nilai < 0n) {
    throw new Error(`Nominal Rupiah tidak boleh negatif: "${input}"`);
  }

  return nilai;
}
