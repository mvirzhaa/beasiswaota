/**
 * Midtrans mengirim nominal sebagai string dengan 2 desimal (mis.
 * "150000.00") walau domain kita Rupiah penuh tanpa sen (aturan keras #1).
 * Fungsi murni: tolak tegas kalau ada sen pecahan, jangan membulatkan diam-diam.
 */
export function parseGrossAmount(nilai: string): bigint {
  const cocok = /^(\d+)\.(\d{2})$/.exec(nilai.trim());
  if (!cocok) {
    throw new Error(`Format gross_amount tidak dikenali: "${nilai}"`);
  }
  const [, bagianBulat, bagianSen] = cocok;
  if (bagianSen !== "00") {
    throw new Error(`gross_amount mengandung sen pecahan yang tidak didukung: "${nilai}"`);
  }
  return BigInt(bagianBulat);
}

/** Format bigint Rupiah ke string gross_amount yang Midtrans harapkan. */
export function formatGrossAmount(nominal: bigint): string {
  return `${nominal.toString()}.00`;
}
