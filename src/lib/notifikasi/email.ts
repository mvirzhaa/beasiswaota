import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env";
import type { EmailTerkomposisi } from "./template";

let klien: Transporter | null = null;
function ambilKlien(): Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_APP_PASSWORD) return null;
  if (!klien) {
    klien = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: env.SMTP_USER, pass: env.SMTP_APP_PASSWORD },
    });
  }
  return klien;
}

export interface HasilKirimEmail {
  terkirim: boolean;
  alasan?: string;
}

/**
 * Email adalah kanal PELENGKAP — Notifikasi in-app di DB tetap sumber
 * kebenaran. Kalau SMTP_USER/SMTP_APP_PASSWORD belum diisi (opsional di
 * env.ts), fungsi ini no-op dengan jelas, tidak melempar error, supaya
 * alur utama (mis. cron) tidak gagal cuma karena email belum dikonfigurasi.
 */
export async function kirimEmail(to: string, isi: EmailTerkomposisi): Promise<HasilKirimEmail> {
  const smtp = ambilKlien();
  if (!smtp) {
    return { terkirim: false, alasan: "SMTP_USER/SMTP_APP_PASSWORD belum dikonfigurasi" };
  }

  try {
    await smtp.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: isi.subject,
      html: isi.html,
    });
    return { terkirim: true };
  } catch (error) {
    return { terkirim: false, alasan: error instanceof Error ? error.message : String(error) };
  }
}
