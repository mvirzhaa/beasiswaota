-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MAHASISWA', 'ORTU_ASUH', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusUser" AS ENUM ('MENUNGGU_VERIFIKASI', 'AKTIF', 'NONAKTIF', 'DIBLOKIR');

-- CreateEnum
CREATE TYPE "StatusPeriode" AS ENUM ('DRAFT', 'PENDAFTARAN', 'SELEKSI', 'PENYALURAN', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusPengajuan" AS ENUM ('DRAFT', 'DIAJUKAN', 'VERIFIKASI_BERKAS', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "JenisBerkas" AS ENUM ('KTM', 'KARTU_KELUARGA', 'KTP_ORTU', 'SKTM', 'SLIP_GAJI_ORTU', 'FOTO_RUMAH', 'TRANSKRIP_NILAI', 'SURAT_PERNYATAAN', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusBerkas" AS ENUM ('MENUNGGU', 'VALID', 'TIDAK_VALID');

-- CreateEnum
CREATE TYPE "TipeOrtuAsuh" AS ENUM ('INDIVIDU', 'DOSEN', 'TENAGA_KEPENDIDIKAN', 'ALUMNI', 'INSTANSI');

-- CreateEnum
CREATE TYPE "SkemaBantuan" AS ENUM ('FULL', 'PARSIAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TipeKomitmen" AS ENUM ('SEKALI', 'BERULANG');

-- CreateEnum
CREATE TYPE "MekanismePenyaluran" AS ENUM ('TRANSFER_MANUAL', 'VIRTUAL_ACCOUNT', 'POTONG_GAJI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "RitmeBayar" AS ENUM ('PER_PERIODE', 'PER_BULAN');

-- CreateEnum
CREATE TYPE "StatusKomitmen" AS ENUM ('MENUNGGU_KONFIRMASI', 'AKTIF', 'MENUNGGAK', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusJadwalBayar" AS ENUM ('BELUM_JATUH_TEMPO', 'JATUH_TEMPO', 'TERBAYAR', 'TERLAMBAT', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusTransaksi" AS ENUM ('MENUNGGU_VERIFIKASI', 'TERVERIFIKASI', 'DITOLAK', 'DIKEMBALIKAN');

-- CreateEnum
CREATE TYPE "StatusTagihan" AS ENUM ('BELUM_LUNAS', 'LUNAS_SEBAGIAN', 'LUNAS', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusAlokasi" AS ENUM ('DRAFT', 'DISETUJUI', 'DISALURKAN', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "MetodeAlokasi" AS ENUM ('OTOMATIS', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipeLedger" AS ENUM ('KREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "StatusRelasiAsuh" AS ENUM ('AKTIF', 'SELESAI', 'DIALIHKAN', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusLaporan" AS ENUM ('DRAFT', 'DIKIRIM', 'PERLU_REVISI', 'DIVERIFIKASI');

-- CreateEnum
CREATE TYPE "StatusPesan" AS ENUM ('MENUNGGU_MODERASI', 'DITERUSKAN', 'DITOLAK');

-- CreateEnum
CREATE TYPE "TingkatRisiko" AS ENUM ('AMAN', 'PERHATIAN', 'KRITIS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "Role" NOT NULL,
    "status" "StatusUser" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periode" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "tahun_akademik" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "nominal_full" BIGINT NOT NULL,
    "tgl_buka" TIMESTAMP(3) NOT NULL,
    "tgl_tutup" TIMESTAMP(3) NOT NULL,
    "status" "StatusPeriode" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mahasiswa" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "fakultas" TEXT NOT NULL,
    "prodi" TEXT NOT NULL,
    "angkatan" INTEGER NOT NULL,
    "semester_berjalan" INTEGER NOT NULL,
    "ipk" DECIMAL(3,2),
    "no_hp" TEXT NOT NULL,
    "alamat" TEXT,
    "status_akademik" TEXT NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan" (
    "id" TEXT NOT NULL,
    "mahasiswa_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "nominal_kebutuhan" BIGINT NOT NULL,
    "penghasilan_ortu" BIGINT NOT NULL,
    "jml_tanggungan" INTEGER NOT NULL,
    "status_ortu" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "skor" DECIMAL(6,2),
    "skor_detail" JSONB,
    "status" "StatusPengajuan" NOT NULL DEFAULT 'DRAFT',
    "catatan_verifikator" TEXT,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengajuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan_berkas" (
    "id" TEXT NOT NULL,
    "pengajuan_id" TEXT NOT NULL,
    "jenis" "JenisBerkas" NOT NULL,
    "object_key" TEXT NOT NULL,
    "nama_asli" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "ukuran_byte" INTEGER NOT NULL,
    "checksum" TEXT,
    "status" "StatusBerkas" NOT NULL DEFAULT 'MENUNGGU',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengajuan_berkas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagihan" (
    "id" TEXT NOT NULL,
    "mahasiswa_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "komponen" TEXT NOT NULL DEFAULT 'UKT',
    "nominal" BIGINT NOT NULL,
    "terbayar" BIGINT NOT NULL DEFAULT 0,
    "ref_keuangan" TEXT,
    "jatuh_tempo" TIMESTAMP(3) NOT NULL,
    "status" "StatusTagihan" NOT NULL DEFAULT 'BELUM_LUNAS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tagihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ortu_asuh" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" "TipeOrtuAsuh" NOT NULL,
    "instansi" TEXT,
    "nip" TEXT,
    "no_hp" TEXT NOT NULL,
    "no_hp_alternatif" TEXT NOT NULL,
    "alamat" TEXT,
    "atas_nama_munfiq" TEXT,
    "anonim" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ortu_asuh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "komitmen" (
    "id" TEXT NOT NULL,
    "ortu_asuh_id" TEXT NOT NULL,
    "skema" "SkemaBantuan" NOT NULL,
    "nominal_per_periode" BIGINT NOT NULL,
    "jumlah_periode" INTEGER NOT NULL,
    "tipe" "TipeKomitmen" NOT NULL,
    "mekanisme" "MekanismePenyaluran" NOT NULL,
    "ritme" "RitmeBayar" NOT NULL DEFAULT 'PER_PERIODE',
    "preferensi" JSONB,
    "tgl_mulai" TIMESTAMP(3) NOT NULL,
    "status" "StatusKomitmen" NOT NULL DEFAULT 'MENUNGGU_KONFIRMASI',
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "komitmen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_bayar" (
    "id" TEXT NOT NULL,
    "komitmen_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "nominal" BIGINT NOT NULL,
    "jatuh_tempo" TIMESTAMP(3) NOT NULL,
    "status" "StatusJadwalBayar" NOT NULL DEFAULT 'BELUM_JATUH_TEMPO',
    "reminded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_bayar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL,
    "ortu_asuh_id" TEXT NOT NULL,
    "komitmen_id" TEXT,
    "jadwal_bayar_id" TEXT,
    "nominal" BIGINT NOT NULL,
    "metode" "MekanismePenyaluran" NOT NULL,
    "ref_eksternal" TEXT,
    "bukti_object_key" TEXT,
    "status" "StatusTransaksi" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "tgl_bayar" TIMESTAMP(3) NOT NULL,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "catatan_tolak" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alokasi" (
    "id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "tagihan_id" TEXT NOT NULL,
    "nominal" BIGINT NOT NULL,
    "status" "StatusAlokasi" NOT NULL DEFAULT 'DRAFT',
    "metode" "MetodeAlokasi" NOT NULL DEFAULT 'OTOMATIS',
    "batch_id" TEXT,
    "alasan_prioritas" JSONB,
    "dibuat_oleh_id" TEXT,
    "disetujui_oleh_id" TEXT,
    "disetujui_at" TIMESTAMP(3),
    "tgl_salur" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alokasi_sumber" (
    "id" TEXT NOT NULL,
    "alokasi_id" TEXT NOT NULL,
    "transaksi_id" TEXT NOT NULL,
    "nominal" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alokasi_sumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dana_ledger" (
    "id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "tipe" "TipeLedger" NOT NULL,
    "nominal" BIGINT NOT NULL,
    "saldo_setelah" BIGINT NOT NULL,
    "transaksi_id" TEXT,
    "alokasi_id" TEXT,
    "keterangan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dana_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relasi_asuh" (
    "id" TEXT NOT NULL,
    "ortu_asuh_id" TEXT NOT NULL,
    "mahasiswa_id" TEXT NOT NULL,
    "periode_mulai_id" TEXT NOT NULL,
    "tgl_mulai" TIMESTAMP(3) NOT NULL,
    "tgl_selesai" TIMESTAMP(3),
    "status" "StatusRelasiAsuh" NOT NULL DEFAULT 'AKTIF',
    "persetujuan_mahasiswa" BOOLEAN NOT NULL DEFAULT false,
    "persetujuan_at" TIMESTAMP(3),
    "ditugaskan_oleh_id" TEXT NOT NULL,
    "alasan_berakhir" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relasi_asuh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_akademik" (
    "id" TEXT NOT NULL,
    "mahasiswa_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "ip_semester" DECIMAL(3,2),
    "ipk" DECIMAL(3,2),
    "sks_semester" INTEGER,
    "sks_kumulatif" INTEGER,
    "status_akademik" TEXT NOT NULL,
    "persen_kehadiran" DECIMAL(5,2),
    "risiko" "TingkatRisiko" NOT NULL DEFAULT 'AMAN',
    "catatan_risiko" TEXT,
    "sumber_data" TEXT NOT NULL DEFAULT 'MANUAL',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitoring_akademik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_perkembangan" (
    "id" TEXT NOT NULL,
    "mahasiswa_id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "lampiran_key" TEXT,
    "status" "StatusLaporan" NOT NULL DEFAULT 'DRAFT',
    "batas_kirim" TIMESTAMP(3) NOT NULL,
    "dikirim_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "catatan_review" TEXT,
    "boleh_dibaca_pembina" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_perkembangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesan_binaan" (
    "id" TEXT NOT NULL,
    "relasi_asuh_id" TEXT NOT NULL,
    "pengirim_id" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "status" "StatusPesan" NOT NULL DEFAULT 'MENUNGGU_MODERASI',
    "moderator_id" TEXT,
    "moderated_at" TIMESTAMP(3),
    "alasan_tolak" TEXT,
    "dibaca_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesan_binaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "aktor_id" TEXT,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitas_id" TEXT NOT NULL,
    "sebelum" JSONB,
    "sesudah" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kanal" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "tautan" TEXT,
    "dibaca_at" TIMESTAMP(3),
    "terkirim_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaturan" (
    "kunci" TEXT NOT NULL,
    "nilai" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_pkey" PRIMARY KEY ("kunci")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "periode_kode_key" ON "periode"("kode");

-- CreateIndex
CREATE INDEX "periode_status_idx" ON "periode"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_user_id_key" ON "mahasiswa"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_nim_key" ON "mahasiswa"("nim");

-- CreateIndex
CREATE INDEX "mahasiswa_fakultas_prodi_idx" ON "mahasiswa"("fakultas", "prodi");

-- CreateIndex
CREATE INDEX "mahasiswa_status_akademik_idx" ON "mahasiswa"("status_akademik");

-- CreateIndex
CREATE INDEX "pengajuan_periode_id_status_skor_idx" ON "pengajuan"("periode_id", "status", "skor");

-- CreateIndex
CREATE UNIQUE INDEX "pengajuan_mahasiswa_id_periode_id_key" ON "pengajuan"("mahasiswa_id", "periode_id");

-- CreateIndex
CREATE INDEX "pengajuan_berkas_pengajuan_id_idx" ON "pengajuan_berkas"("pengajuan_id");

-- CreateIndex
CREATE INDEX "tagihan_periode_id_status_idx" ON "tagihan"("periode_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tagihan_mahasiswa_id_periode_id_komponen_key" ON "tagihan"("mahasiswa_id", "periode_id", "komponen");

-- CreateIndex
CREATE UNIQUE INDEX "ortu_asuh_user_id_key" ON "ortu_asuh"("user_id");

-- CreateIndex
CREATE INDEX "ortu_asuh_tipe_idx" ON "ortu_asuh"("tipe");

-- CreateIndex
CREATE INDEX "komitmen_status_idx" ON "komitmen"("status");

-- CreateIndex
CREATE INDEX "komitmen_ortu_asuh_id_status_idx" ON "komitmen"("ortu_asuh_id", "status");

-- CreateIndex
CREATE INDEX "jadwal_bayar_status_jatuh_tempo_idx" ON "jadwal_bayar"("status", "jatuh_tempo");

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_bayar_komitmen_id_periode_id_urutan_key" ON "jadwal_bayar"("komitmen_id", "periode_id", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_ref_eksternal_key" ON "transaksi"("ref_eksternal");

-- CreateIndex
CREATE INDEX "transaksi_status_tgl_bayar_idx" ON "transaksi"("status", "tgl_bayar");

-- CreateIndex
CREATE INDEX "transaksi_ortu_asuh_id_idx" ON "transaksi"("ortu_asuh_id");

-- CreateIndex
CREATE INDEX "alokasi_periode_id_status_idx" ON "alokasi"("periode_id", "status");

-- CreateIndex
CREATE INDEX "alokasi_batch_id_idx" ON "alokasi"("batch_id");

-- CreateIndex
CREATE INDEX "alokasi_sumber_transaksi_id_idx" ON "alokasi_sumber"("transaksi_id");

-- CreateIndex
CREATE UNIQUE INDEX "alokasi_sumber_alokasi_id_transaksi_id_key" ON "alokasi_sumber"("alokasi_id", "transaksi_id");

-- CreateIndex
CREATE INDEX "dana_ledger_periode_id_created_at_idx" ON "dana_ledger"("periode_id", "created_at");

-- CreateIndex
CREATE INDEX "relasi_asuh_ortu_asuh_id_status_idx" ON "relasi_asuh"("ortu_asuh_id", "status");

-- CreateIndex
CREATE INDEX "relasi_asuh_mahasiswa_id_status_idx" ON "relasi_asuh"("mahasiswa_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "relasi_asuh_ortu_asuh_id_mahasiswa_id_periode_mulai_id_key" ON "relasi_asuh"("ortu_asuh_id", "mahasiswa_id", "periode_mulai_id");

-- CreateIndex
CREATE INDEX "monitoring_akademik_periode_id_risiko_idx" ON "monitoring_akademik"("periode_id", "risiko");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_akademik_mahasiswa_id_periode_id_key" ON "monitoring_akademik"("mahasiswa_id", "periode_id");

-- CreateIndex
CREATE INDEX "laporan_perkembangan_periode_id_status_idx" ON "laporan_perkembangan"("periode_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_perkembangan_mahasiswa_id_periode_id_key" ON "laporan_perkembangan"("mahasiswa_id", "periode_id");

-- CreateIndex
CREATE INDEX "pesan_binaan_relasi_asuh_id_status_idx" ON "pesan_binaan"("relasi_asuh_id", "status");

-- CreateIndex
CREATE INDEX "audit_log_entitas_entitas_id_idx" ON "audit_log"("entitas", "entitas_id");

-- CreateIndex
CREATE INDEX "audit_log_aktor_id_created_at_idx" ON "audit_log"("aktor_id", "created_at");

-- CreateIndex
CREATE INDEX "notifikasi_user_id_dibaca_at_idx" ON "notifikasi"("user_id", "dibaca_at");

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_berkas" ADD CONSTRAINT "pengajuan_berkas_pengajuan_id_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "tagihan_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagihan" ADD CONSTRAINT "tagihan_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ortu_asuh" ADD CONSTRAINT "ortu_asuh_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "komitmen" ADD CONSTRAINT "komitmen_ortu_asuh_id_fkey" FOREIGN KEY ("ortu_asuh_id") REFERENCES "ortu_asuh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_bayar" ADD CONSTRAINT "jadwal_bayar_komitmen_id_fkey" FOREIGN KEY ("komitmen_id") REFERENCES "komitmen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_bayar" ADD CONSTRAINT "jadwal_bayar_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_ortu_asuh_id_fkey" FOREIGN KEY ("ortu_asuh_id") REFERENCES "ortu_asuh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_komitmen_id_fkey" FOREIGN KEY ("komitmen_id") REFERENCES "komitmen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_jadwal_bayar_id_fkey" FOREIGN KEY ("jadwal_bayar_id") REFERENCES "jadwal_bayar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alokasi" ADD CONSTRAINT "alokasi_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alokasi" ADD CONSTRAINT "alokasi_tagihan_id_fkey" FOREIGN KEY ("tagihan_id") REFERENCES "tagihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alokasi_sumber" ADD CONSTRAINT "alokasi_sumber_alokasi_id_fkey" FOREIGN KEY ("alokasi_id") REFERENCES "alokasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alokasi_sumber" ADD CONSTRAINT "alokasi_sumber_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dana_ledger" ADD CONSTRAINT "dana_ledger_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dana_ledger" ADD CONSTRAINT "dana_ledger_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dana_ledger" ADD CONSTRAINT "dana_ledger_alokasi_id_fkey" FOREIGN KEY ("alokasi_id") REFERENCES "alokasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relasi_asuh" ADD CONSTRAINT "relasi_asuh_ortu_asuh_id_fkey" FOREIGN KEY ("ortu_asuh_id") REFERENCES "ortu_asuh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relasi_asuh" ADD CONSTRAINT "relasi_asuh_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relasi_asuh" ADD CONSTRAINT "relasi_asuh_periode_mulai_id_fkey" FOREIGN KEY ("periode_mulai_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_akademik" ADD CONSTRAINT "monitoring_akademik_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_akademik" ADD CONSTRAINT "monitoring_akademik_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_perkembangan" ADD CONSTRAINT "laporan_perkembangan_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_perkembangan" ADD CONSTRAINT "laporan_perkembangan_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesan_binaan" ADD CONSTRAINT "pesan_binaan_relasi_asuh_id_fkey" FOREIGN KEY ("relasi_asuh_id") REFERENCES "relasi_asuh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesan_binaan" ADD CONSTRAINT "pesan_binaan_pengirim_id_fkey" FOREIGN KEY ("pengirim_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_aktor_id_fkey" FOREIGN KEY ("aktor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
