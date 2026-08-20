import { z } from "zod";

export const laporanPerkembanganSchema = z.object({
  isi: z.string().min(20, "Isi laporan minimal 20 karakter"),
});

export const reviewLaporanSchema = z.object({
  catatan: z.string().min(5, "Catatan wajib diisi (minimal 5 karakter)"),
});
