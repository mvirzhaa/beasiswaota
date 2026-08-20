import { statusAkademikValues, type StatusAkademikMonitoring } from "./risiko";

export interface BarisMentahMonitoring {
  nim: unknown;
  ipSemester: unknown;
  ipk: unknown;
  sksSemester: unknown;
  sksKumulatif: unknown;
  statusAkademik: unknown;
  persenKehadiran: unknown;
}

export interface BarisMonitoringValid {
  /** Nomor baris di file sumber (termasuk header), untuk pesan error yang bisa ditelusuri. */
  baris: number;
  nim: string;
  ipSemester: number | null;
  ipk: number | null;
  sksSemester: number | null;
  sksKumulatif: number | null;
  statusAkademik: StatusAkademikMonitoring;
  persenKehadiran: number | null;
}

export interface BarisMonitoringError {
  baris: number;
  pesan: string;
}

export interface HasilParseMonitoring {
  valid: BarisMonitoringValid[];
  error: BarisMonitoringError[];
}

function keNumberOpsional(nilai: unknown): number | null | "INVALID" {
  if (nilai === null || nilai === undefined || nilai === "") return null;
  const angka = typeof nilai === "number" ? nilai : Number(String(nilai).replace(",", "."));
  if (Number.isNaN(angka)) return "INVALID";
  return angka;
}

/**
 * Fungsi murni: validasi & normalisasi baris mentah hasil baca sheet.
 * Tidak menyentuh DB — resolusi NIM -> mahasiswaId dilakukan terpisah oleh
 * pemanggil (Server Action), supaya fungsi ini tetap testable tanpa DB dan
 * tanpa dependensi exceljs.
 */
export function parseBarisMonitoring(
  barisMentah: { baris: number; data: BarisMentahMonitoring }[],
): HasilParseMonitoring {
  const valid: BarisMonitoringValid[] = [];
  const error: BarisMonitoringError[] = [];

  for (const { baris, data } of barisMentah) {
    const nim =
      typeof data.nim === "string" ? data.nim.trim() : String(data.nim ?? "").trim();
    if (!nim) {
      error.push({ baris, pesan: "NIM kosong" });
      continue;
    }

    const statusRaw =
      typeof data.statusAkademik === "string" ? data.statusAkademik.trim().toUpperCase() : "";
    if (!statusAkademikValues.includes(statusRaw as StatusAkademikMonitoring)) {
      error.push({
        baris,
        pesan: `Status akademik tidak valid: "${String(data.statusAkademik)}" (harus AKTIF/CUTI/LULUS/DO)`,
      });
      continue;
    }

    const ipSemester = keNumberOpsional(data.ipSemester);
    const ipk = keNumberOpsional(data.ipk);
    const sksSemester = keNumberOpsional(data.sksSemester);
    const sksKumulatif = keNumberOpsional(data.sksKumulatif);
    const persenKehadiran = keNumberOpsional(data.persenKehadiran);

    const kolomInvalid: string[] = [];
    if (ipSemester === "INVALID") kolomInvalid.push("IP Semester");
    if (ipk === "INVALID") kolomInvalid.push("IPK");
    if (sksSemester === "INVALID") kolomInvalid.push("SKS Semester");
    if (sksKumulatif === "INVALID") kolomInvalid.push("SKS Kumulatif");
    if (persenKehadiran === "INVALID") kolomInvalid.push("Persen Kehadiran");
    if (kolomInvalid.length > 0) {
      error.push({ baris, pesan: `Kolom tidak berupa angka: ${kolomInvalid.join(", ")}` });
      continue;
    }

    if (typeof ipk === "number" && (ipk < 0 || ipk > 4)) {
      error.push({ baris, pesan: `IPK di luar rentang 0-4: ${ipk}` });
      continue;
    }
    if (typeof ipSemester === "number" && (ipSemester < 0 || ipSemester > 4)) {
      error.push({ baris, pesan: `IP Semester di luar rentang 0-4: ${ipSemester}` });
      continue;
    }
    if (typeof persenKehadiran === "number" && (persenKehadiran < 0 || persenKehadiran > 100)) {
      error.push({ baris, pesan: `Persen kehadiran di luar rentang 0-100: ${persenKehadiran}` });
      continue;
    }

    valid.push({
      baris,
      nim,
      ipSemester: ipSemester as number | null,
      ipk: ipk as number | null,
      sksSemester: sksSemester as number | null,
      sksKumulatif: sksKumulatif as number | null,
      statusAkademik: statusRaw as StatusAkademikMonitoring,
      persenKehadiran: persenKehadiran as number | null,
    });
  }

  return { valid, error };
}
