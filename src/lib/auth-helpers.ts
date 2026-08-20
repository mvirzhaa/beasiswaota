import { randomBytes } from "node:crypto";
import type { StatusUser } from "@prisma/client";

/**
 * Aturan: hanya user berstatus AKTIF yang boleh login. MENUNGGU_VERIFIKASI,
 * NONAKTIF, dan DIBLOKIR semuanya ditolak. Dipisah jadi fungsi murni supaya
 * bisa ditest tanpa memanggil database atau argon2.
 */
export function bolehLogin(status: StatusUser): boolean {
  return status === "AKTIF";
}

// Tanpa karakter yang gampang tertukar saat dibacakan/diketik ulang: 0/O, 1/l/I.
const ALFABET_PASSWORD_SEMENTARA = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Password sementara untuk akun yang dibuatkan admin (mis. camaba), dikirim lewat email. */
export function buatPasswordSementara(panjang = 12): string {
  const bytes = randomBytes(panjang);
  let hasil = "";
  for (let i = 0; i < panjang; i += 1) {
    hasil += ALFABET_PASSWORD_SEMENTARA[bytes[i] % ALFABET_PASSWORD_SEMENTARA.length];
  }
  return hasil;
}
