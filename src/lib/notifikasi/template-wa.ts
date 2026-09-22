import { formatRupiah } from "../uang";

// Pesan WA plain-text — beda dari template.ts (HTML untuk email) karena WA
// tidak merender HTML. Dipakai kirimWa() di src/lib/notifikasi/wa.ts.

export function pesanWaReminderKomitmenBulanan(input: {
  namaDonatur: string;
  nominal: bigint;
  jatuhTempo: Date;
  url: string;
}): string {
  const tanggal = input.jatuhTempo.toLocaleDateString("id-ID");
  return [
    `Assalamu'alaikum, ${input.namaDonatur}.`,
    ``,
    `Ini pengingat pembayaran komitmen donasi Beasiswa Orangtua Asuh UIKA Bogor bulan ini:`,
    `Nominal: ${formatRupiah(input.nominal)}`,
    `Jatuh tempo: ${tanggal}`,
    ``,
    `Lihat detail & jadwal pembayaran Anda di:`,
    input.url,
    ``,
    `Terima kasih atas kepedulian Anda.`,
  ].join("\n");
}

export function pesanWaLaporanSemesterSiap(input: { namaDonatur: string; periodeKode: string; url: string }): string {
  return [
    `Assalamu'alaikum, ${input.namaDonatur}.`,
    ``,
    `Laporan penyaluran dana Anda untuk periode ${input.periodeKode} sudah tersedia:`,
    input.url,
    ``,
    `Terima kasih atas kepedulian Anda terhadap mahasiswa penerima Beasiswa Orangtua Asuh UIKA Bogor.`,
  ].join("\n");
}
