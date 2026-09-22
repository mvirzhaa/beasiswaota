import { z } from "zod";

export const buatMahasiswaSchema = z.object({
  nim: z.string().min(1, "NIM wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  fakultas: z.string().min(1, "Fakultas wajib diisi"),
  prodi: z.string().min(1, "Program studi wajib diisi"),
  angkatan: z.coerce.number().int().min(2000).max(2100),
  semesterBerjalan: z.coerce.number().int().min(1).max(14),
  noHp: z.string().min(8, "Nomor HP tidak valid"),
  alamat: z.string().optional(),
});

export const statusAkademikSchema = z.enum(["AKTIF", "CUTI", "LULUS", "DO"]);

export const ubahMahasiswaSchema = buatMahasiswaSchema.extend({
  statusAkademik: statusAkademikSchema,
});

export type BuatMahasiswaInput = z.infer<typeof buatMahasiswaSchema>;
export type UbahMahasiswaInput = z.infer<typeof ubahMahasiswaSchema>;

// Tagihan UKT dibuat/diubah admin di sini — TAPI field `terbayar` & `status`
// sengaja TIDAK ada di schema ini. Keduanya hanya boleh berubah lewat
// setujuiBatch() (aturan keras #3), jadi form tagihan hanya pernah menulis
// kewajiban (nominal/komponen/jatuh tempo), tidak pernah realisasi bayar.
export const komponenTagihanSchema = z.enum(["UKT", "SPP", "LAINNYA"]);

export const tagihanSchema = z.object({
  periodeId: z.string().min(1, "Periode wajib dipilih"),
  komponen: komponenTagihanSchema,
  nominal: z.string().min(1, "Nominal wajib diisi"),
  jatuhTempo: z.string().min(1, "Jatuh tempo wajib diisi"),
});

export type TagihanInput = z.infer<typeof tagihanSchema>;
