import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  // Ditentukan oleh server action pemanggil (bukan dari input form),
  // memisahkan jalur login publik (/login) dari jalur rahasia admin.
  // Default "publik" = paling ketat: role ADMIN otomatis ditolak kalau
  // field ini entah bagaimana tidak terkirim.
  mode: z.enum(["publik", "admin"]).default("publik"),
});

export type LoginInput = z.infer<typeof loginSchema>;
