import { z } from "zod";
import { parseRupiah } from "../uang";

export const catatPengeluaranLainSchema = z.object({
  periodeId: z.string().min(1, "Periode wajib dipilih"),
  nominal: z
    .string()
    .min(1, "Wajib diisi")
    .transform((val, ctx) => {
      try {
        const nilai = parseRupiah(val);
        if (nilai <= 0n) {
          ctx.addIssue({ code: "custom", message: "Nominal harus lebih dari nol" });
          return z.NEVER;
        }
        return nilai;
      } catch {
        ctx.addIssue({ code: "custom", message: "Nominal tidak valid" });
        return z.NEVER;
      }
    }),
  keterangan: z.string().min(5, "Keterangan wajib diisi (minimal 5 karakter)"),
});

export type CatatPengeluaranLainInput = z.infer<typeof catatPengeluaranLainSchema>;
