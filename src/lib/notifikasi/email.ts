import { Resend } from "resend";
import { env } from "../env";
import type { EmailTerkomposisi } from "./template";

let klien: Resend | null = null;
function ambilKlien(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!klien) klien = new Resend(env.RESEND_API_KEY);
  return klien;
}

export interface HasilKirimEmail {
  terkirim: boolean;
  alasan?: string;
}

/**
 * Email adalah kanal PELENGKAP — Notifikasi in-app di DB tetap sumber
 * kebenaran. Kalau RESEND_API_KEY belum diisi (opsional di env.ts),
 * fungsi ini no-op dengan jelas, tidak melempar error, supaya alur utama
 * (mis. cron) tidak gagal cuma karena email belum dikonfigurasi.
 */
export async function kirimEmail(to: string, isi: EmailTerkomposisi): Promise<HasilKirimEmail> {
  const resend = ambilKlien();
  if (!resend) {
    return { terkirim: false, alasan: "RESEND_API_KEY belum dikonfigurasi" };
  }

  const hasil = await resend.emails.send({
    from: env.MAIL_FROM,
    to,
    subject: isi.subject,
    html: isi.html,
  });

  if (hasil.error) {
    return { terkirim: false, alasan: hasil.error.message };
  }
  return { terkirim: true };
}
