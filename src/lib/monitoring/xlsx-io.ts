import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import type { BarisMentahMonitoring } from "./xlsx-parse";

export const HEADER_KOLOM_MONITORING = [
  "NIM",
  "IP Semester",
  "IPK",
  "SKS Semester",
  "SKS Kumulatif",
  "Status Akademik",
  "Persen Kehadiran",
];

function nilaiSel(nilai: ExcelJS.CellValue): unknown {
  if (nilai === null || nilai === undefined) return "";
  if (typeof nilai === "object") {
    if ("text" in nilai) return (nilai as { text: string }).text;
    if ("result" in nilai) return (nilai as { result: unknown }).result;
  }
  return nilai;
}

/**
 * Baca baris mentah dari sheet pertama file XLSX (baris 1 = header,
 * kolom sesuai HEADER_KOLOM_MONITORING). Bukan fungsi murni (I/O file) —
 * validasi isinya ada di parseBarisMonitoring (pure, testable terpisah).
 */
export async function bacaBarisXlsxMonitoring(
  buffer: Buffer,
): Promise<{ baris: number; data: BarisMentahMonitoring }[]> {
  // workbook.xlsx.load() typing di exceljs bentrok dengan Buffer generik
  // dari @types/node terbaru — pakai read(stream) yang typing-nya bersih.
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from(buffer));
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const hasil: { baris: number; data: BarisMentahMonitoring }[] = [];
  sheet.eachRow((row, nomorBaris) => {
    if (nomorBaris === 1) return;
    const kosong = row.values === undefined || (Array.isArray(row.values) && row.values.length <= 1);
    if (kosong) return;

    hasil.push({
      baris: nomorBaris,
      data: {
        nim: nilaiSel(row.getCell(1).value),
        ipSemester: nilaiSel(row.getCell(2).value),
        ipk: nilaiSel(row.getCell(3).value),
        sksSemester: nilaiSel(row.getCell(4).value),
        sksKumulatif: nilaiSel(row.getCell(5).value),
        statusAkademik: nilaiSel(row.getCell(6).value),
        persenKehadiran: nilaiSel(row.getCell(7).value),
      },
    });
  });
  return hasil;
}
