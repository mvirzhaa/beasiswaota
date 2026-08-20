import { formatRupiah } from "../uang";

export interface EmailTerkomposisi {
  subject: string;
  html: string;
}

const BUNGKUS = (isi: string) => `<div style="font-family:sans-serif;font-size:14px;color:#111">${isi}</div>`;

export function templateReminderJadwalBayar(input: {
  namaDonatur: string;
  periodeKode: string;
  nominal: bigint;
  jatuhTempo: Date;
  hariMenuju: number;
}): EmailTerkomposisi {
  const tanggal = input.jatuhTempo.toLocaleDateString("id-ID");
  return {
    subject: `Pengingat jatuh tempo H-${input.hariMenuju} — Beasiswa Orangtua Asuh UIKA`,
    html: BUNGKUS(`
      <p>Yth. ${input.namaDonatur},</p>
      <p>Ini pengingat bahwa komitmen donasi Anda untuk periode ${input.periodeKode} sebesar
      <strong>${formatRupiah(input.nominal)}</strong> akan jatuh tempo pada <strong>${tanggal}</strong>
      (H-${input.hariMenuju}).</p>
      <p>Mohon segera melakukan pembayaran melalui halaman Pembayaran di sistem.</p>
      <p>Terima kasih atas kepedulian Anda.</p>
      <p>Beasiswa Orangtua Asuh — Universitas Ibn Khaldun Bogor</p>
    `),
  };
}

export function templateLaporanReminder(input: {
  namaMahasiswa: string;
  periodeKode: string;
  batasKirim: Date;
}): EmailTerkomposisi {
  const tanggal = input.batasKirim.toLocaleDateString("id-ID");
  return {
    subject: `Pengingat laporan perkembangan periode ${input.periodeKode} — Beasiswa Orangtua Asuh UIKA`,
    html: BUNGKUS(`
      <p>Yth. ${input.namaMahasiswa},</p>
      <p>Laporan perkembangan Anda untuk periode ${input.periodeKode} belum dikirim. Batas
      pengiriman adalah <strong>${tanggal}</strong>.</p>
      <p>Laporan ini adalah syarat perpanjangan beasiswa periode berikutnya. Mohon segera
      dilengkapi melalui halaman Laporan di sistem.</p>
      <p>Beasiswa Orangtua Asuh — Universitas Ibn Khaldun Bogor</p>
    `),
  };
}

export function templateKomitmenMenunggak(input: {
  namaAdmin: string;
  namaDonatur: string;
  hariTerlambat: number;
}): EmailTerkomposisi {
  return {
    subject: `Komitmen menunggak — perlu tindak lanjut`,
    html: BUNGKUS(`
      <p>Yth. ${input.namaAdmin},</p>
      <p>Komitmen donasi atas nama <strong>${input.namaDonatur}</strong> sudah melewati jatuh
      tempo lebih dari ${input.hariTerlambat} hari dan otomatis ditandai MENUNGGAK.</p>
      <p>Mahasiswa penerima tidak kehilangan status penerimanya — kekurangan dana ditutup dari
      pool. Mohon tindak lanjuti komunikasi dengan donatur terkait.</p>
      <p>Beasiswa Orangtua Asuh — Universitas Ibn Khaldun Bogor</p>
    `),
  };
}

export function templateKonfirmasiPembayaran(input: {
  namaDonatur: string;
  nominal: bigint;
}): EmailTerkomposisi {
  return {
    subject: "Konfirmasi pembayaran diterima — Beasiswa Orangtua Asuh UIKA",
    html: BUNGKUS(`
      <p>Yth. ${input.namaDonatur},</p>
      <p>Pembayaran Anda sebesar <strong>${formatRupiah(input.nominal)}</strong> telah kami
      terima dan diverifikasi. Terima kasih atas kepedulian Anda terhadap mahasiswa penerima
      beasiswa.</p>
      <p>Beasiswa Orangtua Asuh — Universitas Ibn Khaldun Bogor</p>
    `),
  };
}
