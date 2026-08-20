import { z } from "zod";

export const tugaskanRelasiSchema = z.object({
  ortuAsuhId: z.string().min(1, "Donatur wajib dipilih"),
  mahasiswaId: z.string().min(1, "Mahasiswa wajib dipilih"),
  periodeMulaiId: z.string().min(1, "Periode wajib dipilih"),
  catatan: z.string().optional(),
});

export const alihkanRelasiSchema = z.object({
  ortuAsuhBaruId: z.string().min(1, "Pembina baru wajib dipilih"),
  periodeMulaiId: z.string().min(1, "Periode wajib dipilih"),
  alasan: z.string().min(5, "Alasan wajib diisi (minimal 5 karakter)"),
});

export const akhiriRelasiSchema = z.object({
  alasan: z.string().min(5, "Alasan wajib diisi (minimal 5 karakter)"),
});

export const kirimPesanSchema = z.object({
  isi: z.string().min(1, "Pesan tidak boleh kosong").max(2000, "Pesan maksimal 2000 karakter"),
});

export const tolakPesanSchema = z.object({
  alasan: z.string().min(5, "Alasan wajib diisi (minimal 5 karakter)"),
});
