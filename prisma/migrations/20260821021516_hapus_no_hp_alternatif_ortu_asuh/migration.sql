-- Hapus kolom no_hp_alternatif dari ortu_asuh — form pendaftaran donatur
-- tidak lagi mengumpulkan nomor HP alternatif (permintaan pengelola
-- program), dan tidak ada data produksi yang bergantung pada kolom ini.
ALTER TABLE "ortu_asuh" DROP COLUMN "no_hp_alternatif";
