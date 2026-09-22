import type { StatusUser } from "@prisma/client";

/**
 * Aturan: hanya user berstatus AKTIF yang boleh login. MENUNGGU_VERIFIKASI,
 * NONAKTIF, dan DIBLOKIR semuanya ditolak. Dipisah jadi fungsi murni supaya
 * bisa ditest tanpa memanggil database atau argon2.
 */
export function bolehLogin(status: StatusUser): boolean {
  return status === "AKTIF";
}
