import { z } from "zod";

// Validasi seluruh environment variable saat startup. Kalau ada yang kurang
// atau salah format, aplikasi gagal keras di sini, bukan gagal senyap nanti
// di tengah request (mis. saat membentuk URL absolut atau mengirim email).
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Semua URL absolut di kode WAJIB dibentuk dari APP_URL ini.
  // Jangan pernah hardcode nama domain di tempat lain.
  APP_URL: z.url(),

  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),

  // Kirim email lewat Gmail SMTP (App Password) memakai akun MAIL_FROM
  // sendiri — tidak perlu verifikasi domain terpisah seperti Resend
  // selama MAIL_FROM memang mailbox Google Workspace domain ini.
  SMTP_USER: z.string().optional(),
  SMTP_APP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.email(),

  CRON_SECRET: z.string().min(16, "CRON_SECRET minimal 16 karakter"),

  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

function muatEnv() {
  const hasil = envSchema.safeParse(process.env);
  if (!hasil.success) {
    const detail = hasil.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Environment variable tidak valid, cek .env:\n${detail}`,
    );
  }
  return hasil.data;
}

export const env = muatEnv();
