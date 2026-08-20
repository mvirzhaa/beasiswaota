import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import type { BarisRealisasiMentah } from "./xlsx-parse";

export const HEADER_KOLOM_REALISASI = ["JadwalBayarId", "NIP", "Nominal Realisasi", "Tanggal Realisasi"];
export const HEADER_KOLOM_EKSPOR = ["JadwalBayarId", "NIP", "Nama Donatur", "Periode", "Nominal"];

function nilaiSel(nilai: ExcelJS.CellValue): unknown {
  if (nilai === null || nilai === undefined) return "";
  if (typeof nilai === "object") {
    if (nilai instanceof Date) return nilai;
    if ("text" in nilai) return (nilai as { text: string }).text;
    if ("result" in nilai) return (nilai as { result: unknown }).result;
  }
  return nilai;
}

export async function bacaBarisXlsxRealisasi(
  buffer: Buffer,
): Promise<{ baris: number; data: BarisRealisasiMentah }[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from(buffer));
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const hasil: { baris: number; data: BarisRealisasiMentah }[] = [];
  sheet.eachRow((row, nomorBaris) => {
    if (nomorBaris === 1) return;
    const kosong = row.values === undefined || (Array.isArray(row.values) && row.values.length <= 1);
    if (kosong) return;

    hasil.push({
      baris: nomorBaris,
      data: {
        jadwalBayarId: nilaiSel(row.getCell(1).value),
        nip: nilaiSel(row.getCell(2).value),
        nominal: nilaiSel(row.getCell(3).value),
        tanggal: nilaiSel(row.getCell(4).value),
      },
    });
  });
  return hasil;
}

export interface BarisEksporPotongan {
  jadwalBayarId: string;
  nip: string;
  namaDonatur: string;
  periodeKode: string;
  nominal: bigint;
}

export async function buatXlsxEksporPotongan(baris: BarisEksporPotongan[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Potongan Gaji");
  sheet.addRow(HEADER_KOLOM_EKSPOR);
  for (const b of baris) {
    sheet.addRow([b.jadwalBayarId, b.nip, b.namaDonatur, b.periodeKode, Number(b.nominal)]);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
