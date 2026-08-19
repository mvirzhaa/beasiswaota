import { z } from "zod";
import { parseRupiah } from "../uang";

export const statusOrtuSchema = z.enum([
  "LENGKAP",
  "YATIM",
  "PIATU",
  "YATIM_PIATU",
]);

// Jenis berkas wajib diunggah sebelum pengajuan bisa diajukan (bukan draft).
// LAINNYA sengaja tidak wajib — dipakai untuk lampiran tambahan opsional.
export const JENIS_BERKAS_WAJIB = [
  "KTM",
  "KARTU_KELUARGA",
  "KTP_ORTU",
  "SKTM",
  "SLIP_GAJI_ORTU",
  "FOTO_RUMAH",
  "TRANSKRIP_NILAI",
  "SURAT_PERNYATAAN",
] as const;

const nominalSchema = z
  .string()
  .min(1, "Wajib diisi")
  .transform((val, ctx) => {
    try {
      return parseRupiah(val);
    } catch {
      ctx.addIssue({ code: "custom", message: "Nominal tidak valid" });
      return z.NEVER;
    }
  });

export const pengajuanSchema = z.object({
  nominalKebutuhan: nominalSchema,
  penghasilanOrtu: nominalSchema,
  jmlTanggungan: z.coerce.number().int().min(0, "Tidak boleh negatif"),
  statusOrtu: statusOrtuSchema,
  alasan: z.string().min(20, "Jelaskan alasan minimal 20 karakter"),
});

export type PengajuanInput = z.infer<typeof pengajuanSchema>;

export const jenisBerkasSchema = z.enum([
  "KTM",
  "KARTU_KELUARGA",
  "KTP_ORTU",
  "SKTM",
  "SLIP_GAJI_ORTU",
  "FOTO_RUMAH",
  "TRANSKRIP_NILAI",
  "SURAT_PERNYATAAN",
  "LAINNYA",
]);

export const LABEL_JENIS_BERKAS: Record<string, string> = {
  KTM: "Kartu Tanda Mahasiswa",
  KARTU_KELUARGA: "Kartu Keluarga",
  KTP_ORTU: "KTP Orang Tua",
  SKTM: "SKTM",
  SLIP_GAJI_ORTU: "Slip Gaji Orang Tua",
  FOTO_RUMAH: "Foto Rumah",
  TRANSKRIP_NILAI: "Transkrip Nilai",
  SURAT_PERNYATAAN: "Surat Pernyataan",
  LAINNYA: "Lainnya (opsional)",
};
