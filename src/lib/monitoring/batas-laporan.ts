const HARI_GRACE_PERIOD_LAPORAN = 30;

/**
 * Fungsi murni: kebijakan batas kirim LaporanPerkembangan = tglTutup
 * periode + masa tenggang. Dipakai baik saat baris LaporanPerkembangan
 * benar-benar dibuat, maupun saat panel admin perlu tahu batas kirim untuk
 * mahasiswa yang belum sempat membuat barisnya sama sekali.
 */
export function hitungBatasKirimLaporan(periode: { tglTutup: Date }): Date {
  const batas = new Date(periode.tglTutup);
  batas.setUTCDate(batas.getUTCDate() + HARI_GRACE_PERIOD_LAPORAN);
  return batas;
}
