import ExcelJS from "exceljs";
import { formatRupiah } from "@/lib/uang";

const LABEL_TIPE: Record<string, string> = {
  INDIVIDU: "Individu",
  DOSEN: "Dosen",
  TENAGA_KEPENDIDIKAN: "Tenaga Kependidikan",
  ALUMNI: "Alumni",
  INSTANSI: "Instansi",
};

export const HEADER_KOLOM_EKSPOR_DONATUR = [
  "Nama",
  "No. HP",
  "Tipe",
  "Instansi",
  "Mahasiswa Binaan",
  "Komitmen Aktif",
  "Komitmen Menunggu",
  "Nominal Komitmen Aktif (per Periode)",
];

export interface BarisEksporDonatur {
  nama: string;
  noHp: string;
  tipe: string;
  instansi: string | null;
  mahasiswaBinaan: number;
  komitmenAktif: number;
  komitmenMenunggu: number;
  nominalKomitmenAktif: bigint;
}

export async function buatXlsxEksporDonatur(baris: BarisEksporDonatur[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Donatur");
  sheet.addRow(HEADER_KOLOM_EKSPOR_DONATUR);
  for (const b of baris) {
    sheet.addRow([
      b.nama,
      b.noHp,
      LABEL_TIPE[b.tipe] ?? b.tipe,
      b.instansi || "-",
      b.mahasiswaBinaan,
      b.komitmenAktif,
      b.komitmenMenunggu,
      formatRupiah(b.nominalKomitmenAktif),
    ]);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
