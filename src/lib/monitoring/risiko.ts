import type { AmbangRisiko } from "./risiko.schema";

export const statusAkademikValues = ["AKTIF", "CUTI", "LULUS", "DO"] as const;
export type StatusAkademikMonitoring = (typeof statusAkademikValues)[number];

export type TingkatRisikoHasil = "AMAN" | "PERHATIAN" | "KRITIS";

export interface HitungRisikoInput {
  ipk: number | null;
  /** IPK semester sebelumnya, null kalau ini data semester pertama (belum ada pembanding). */
  ipkSemesterLalu: number | null;
  statusAkademik: StatusAkademikMonitoring;
}

/**
 * Fungsi murni: tidak menyentuh DB. Ambang batas WAJIB dibaca dari
 * Pengaturan oleh pemanggil (src/server/queries/monitoring.ts), bukan
 * hardcode di sini.
 */
export function hitungRisiko(input: HitungRisikoInput, ambang: AmbangRisiko): TingkatRisikoHasil {
  if (input.statusAkademik === "CUTI" || input.statusAkademik === "DO") {
    return "KRITIS";
  }
  if (input.statusAkademik === "LULUS") {
    return "AMAN";
  }
  if (input.ipk === null) {
    return "AMAN";
  }
  if (input.ipk < ambang.ipkMinimum) {
    return "PERHATIAN";
  }
  if (
    input.ipkSemesterLalu !== null &&
    input.ipkSemesterLalu - input.ipk > ambang.penurunanIpkMaksimum
  ) {
    return "PERHATIAN";
  }
  return "AMAN";
}
