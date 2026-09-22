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

  // Path login khusus admin, sengaja tidak ditautkan di UI publik manapun
  // (lihat src/app/[secretSlug]/page.tsx). Hanya string acak ini, bukan
  // kontrol akses sesungguhnya — RBAC tetap yang menjaga /admin/*.
  ADMIN_LOGIN_PATH: z
    .string()
    .regex(
      /^[a-z0-9-]{8,64}$/,
      "ADMIN_LOGIN_PATH hanya huruf kecil/angka/strip, 8-64 karakter",
    ),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  // Bucket TERPISAH dari MINIO_BUCKET — ini publik (kebalikan aturan keras
  // #7, yang berlaku untuk berkas pengajuan, bukan aset landing page).
  MINIO_BUCKET_PUBLIK: z.string().min(1),

  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.email(),

  // --- WhatsApp (pengingat komitmen berkelanjutan, opsional) ---
  // Belum ada provider WA resmi yang dipakai UIKA saat berkas ini ditulis.
  // Kalau kosong, kirimWa() no-op aman (lihat src/lib/notifikasi/wa.ts),
  // sama seperti pola RESEND_API_KEY di atas.
  WA_API_URL: z.url().optional(),
  WA_API_TOKEN: z.string().optional(),

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
