/**
 * Ubah nomor HP format lokal ("0813-8315-5797" atau "081383155797") ke
 * format internasional tanpa "+" untuk link wa.me ("6281383155797").
 */
export function keFormatWaMe(nomor: string): string {
  const digit = nomor.replace(/\D/g, "");
  return digit.startsWith("0") ? `62${digit.slice(1)}` : digit;
}
