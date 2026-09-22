import { z } from "zod";

export const heroLandingSchema = z.object({
  judul: z.string().min(1, "Judul wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
});

export const pilarLandingSchema = z.object({
  judul: z.string().min(1, "Judul pilar wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi pilar wajib diisi"),
});

// Selalu tepat 4 — sesuai jumlah kartu "4 Pilar" di landing page.
export const daftarPilarLandingSchema = z.array(pilarLandingSchema).length(4);

export const pimpinanLandingSchema = z.object({
  pesan: z.string().min(1, "Pesan pimpinan wajib diisi"),
});

export const rekeningLandingSchema = z.object({
  bank: z.string().min(1, "Nama bank wajib diisi"),
  nomor: z.string().min(1, "Nomor rekening wajib diisi"),
  atasNama: z.string().min(1, "Atas nama wajib diisi"),
});

export const kontakLandingSchema = z.object({
  nama: z.string().min(1, "Nama kontak wajib diisi"),
  nomor: z.string().min(1, "Nomor WA wajib diisi"),
});

// Selalu tepat 2 — sesuai jumlah "Kontak WA" di landing page.
export const daftarKontakLandingSchema = z.array(kontakLandingSchema).length(2);

export const gambarLandingSchema = z.object({
  logo: z.string().optional(),
  heroFoto: z.string().optional(),
  pimpinanFoto: z.string().optional(),
  ceritaFoto: z.string().optional(),
});

export const pengaturanLandingSchema = z.object({
  hero: heroLandingSchema,
  pilar: daftarPilarLandingSchema,
  pimpinan: pimpinanLandingSchema,
  rekening: rekeningLandingSchema,
  kontak: daftarKontakLandingSchema,
  gambar: gambarLandingSchema,
});

export type PengaturanLanding = z.infer<typeof pengaturanLandingSchema>;
export type GambarLanding = z.infer<typeof gambarLandingSchema>;

export const JENIS_GAMBAR_LANDING = ["logo", "heroFoto", "pimpinanFoto", "ceritaFoto"] as const;

export type JenisGambarLanding = (typeof JENIS_GAMBAR_LANDING)[number];
