import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter");

export const registerMahasiswaSchema = z.object({
  email: z.email("Email tidak valid"),
  password: passwordSchema,
  nim: z.string().min(1, "NIM wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  fakultas: z.string().min(1, "Fakultas wajib diisi"),
  prodi: z.string().min(1, "Program studi wajib diisi"),
  angkatan: z.coerce.number().int().min(2000).max(2100),
  semesterBerjalan: z.coerce.number().int().min(1).max(14),
  noHp: z.string().min(8, "Nomor HP tidak valid"),
  alamat: z.string().optional(),
});

export const tipeOrtuAsuhSchema = z.enum([
  "INDIVIDU",
  "DOSEN",
  "TENAGA_KEPENDIDIKAN",
  "ALUMNI",
  "INSTANSI",
]);

export const registerOrtuAsuhSchema = z.object({
  email: z.email("Email tidak valid"),
  password: passwordSchema,
  nama: z.string().min(1, "Nama wajib diisi"),
  tipe: tipeOrtuAsuhSchema,
  instansi: z.string().optional(),
  noHp: z.string().min(8, "Nomor HP tidak valid"),
  noHpAlternatif: z.string().min(8, "Nomor HP alternatif tidak valid"),
  alamat: z.string().optional(),
  atasNamaMunfiq: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterMahasiswaInput = z.infer<typeof registerMahasiswaSchema>;
export type RegisterOrtuAsuhInput = z.infer<typeof registerOrtuAsuhSchema>;
