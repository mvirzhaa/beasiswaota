import { z } from "zod";
import { parseRupiah } from "../uang";

export const metodeTransaksiSchema = z.enum([
  "TRANSFER_MANUAL",
  "VIRTUAL_ACCOUNT",
  "POTONG_GAJI",
  "LAINNYA",
]);

export const unggahBuktiTransferSchema = z.object({
  jadwalBayarId: z.string().optional(),
  nominal: z
    .string()
    .min(1, "Wajib diisi")
    .transform((val, ctx) => {
      try {
        return parseRupiah(val);
      } catch {
        ctx.addIssue({ code: "custom", message: "Nominal tidak valid" });
        return z.NEVER;
      }
    }),
  metode: metodeTransaksiSchema,
  tglBayar: z
    .string()
    .min(1, "Wajib diisi")
    .transform((val, ctx) => {
      const tanggal = new Date(val);
      if (Number.isNaN(tanggal.getTime())) {
        ctx.addIssue({ code: "custom", message: "Tanggal bayar tidak valid" });
        return z.NEVER;
      }
      return tanggal;
    }),
});

export const tolakTransaksiSchema = z.object({
  catatan: z.string().min(5, "Alasan penolakan wajib diisi (minimal 5 karakter)"),
});
