import { z } from "zod";

export const KUNCI_PENGATURAN_AMBANG_RISIKO = "monitoring.ambangRisiko";

export const ambangRisikoSchema = z.object({
  /** IPK di bawah ini otomatis PERHATIAN. */
  ipkMinimum: z.number().min(0).max(4),
  /** Penurunan IPK dari semester lalu melebihi ini juga PERHATIAN. */
  penurunanIpkMaksimum: z.number().min(0).max(4),
});

export type AmbangRisiko = z.infer<typeof ambangRisikoSchema>;

export const AMBANG_RISIKO_DEFAULT: AmbangRisiko = {
  ipkMinimum: 2.5,
  penurunanIpkMaksimum: 0.5,
};
