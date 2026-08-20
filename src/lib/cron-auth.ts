import { env } from "./env";

/**
 * Semua endpoint /api/cron/* dilindungi header ini (bukan session login —
 * dipanggil systemd timer / cron sistem VPS, bukan browser). Lihat contoh
 * unit di deploy/systemd/.
 */
export function verifikasiCronSecret(request: Request): boolean {
  const header = request.headers.get("x-cron-secret");
  return header === env.CRON_SECRET;
}
