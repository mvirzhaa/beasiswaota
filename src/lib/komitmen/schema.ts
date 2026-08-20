import { z } from "zod";

export const skemaBantuanSchema = z.enum(["FULL", "PARSIAL", "CUSTOM"]);
export const mekanismePenyaluranSchema = z.enum([
  "TRANSFER_MANUAL",
  "VIRTUAL_ACCOUNT",
  "POTONG_GAJI",
  "LAINNYA",
]);

// Jangka waktu: opsi cepat 1/2/8 semester, atau CUSTOM dengan angka bebas.
export const jumlahPeriodeOpsiSchema = z.enum(["1", "2", "8", "CUSTOM"]);

export const buatKomitmenSchema = z.object({
  periodeAwalId: z.string().min(1, "Periode wajib dipilih"),
  skema: skemaBantuanSchema,
  // String mentah, sengaja tidak di-transform di sini karena skema FULL
  // tidak butuh nilai ini (nominal ditentukan dari Periode.nominalFull).
  nominalPerPeriode: z.string().optional(),
  jumlahPeriodeOpsi: jumlahPeriodeOpsiSchema,
  jumlahPeriodeCustom: z.coerce.number().int().min(1).max(24).optional(),
  mekanisme: mekanismePenyaluranSchema,
  preferensiFakultas: z.string().optional(),
  preferensiProdi: z.string().optional(),
  preferensiGender: z.string().optional(),
  preferensiAsalDaerah: z.string().optional(),
  catatan: z.string().optional(),
});

export type BuatKomitmenInput = z.infer<typeof buatKomitmenSchema>;
