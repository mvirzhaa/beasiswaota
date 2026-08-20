import { z } from "zod";
import { statusAkademikValues } from "./risiko";

const angkaOpsional = z
  .string()
  .optional()
  .transform((val, ctx) => {
    if (!val || val.trim() === "") return null;
    const n = Number(val);
    if (Number.isNaN(n)) {
      ctx.addIssue({ code: "custom", message: "Harus berupa angka" });
      return z.NEVER;
    }
    return n;
  });

export const inputMonitoringSchema = z.object({
  mahasiswaId: z.string().min(1),
  periodeId: z.string().min(1),
  ipSemester: angkaOpsional,
  ipk: angkaOpsional,
  sksSemester: angkaOpsional,
  sksKumulatif: angkaOpsional,
  statusAkademik: z.enum(statusAkademikValues),
  persenKehadiran: angkaOpsional,
});
