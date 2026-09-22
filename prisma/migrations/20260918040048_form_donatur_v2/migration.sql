-- CreateEnum
CREATE TYPE "KategoriDonatur" AS ENUM ('PERORANGAN', 'LEMBAGA');

-- AlterTable
ALTER TABLE "komitmen" ADD COLUMN     "tanggal_pengingat" INTEGER,
ADD COLUMN     "target_mahasiswa_id" TEXT;

-- AlterTable
ALTER TABLE "ortu_asuh" ADD COLUMN     "internal" BOOLEAN,
ADD COLUMN     "kategori" "KategoriDonatur" NOT NULL DEFAULT 'PERORANGAN',
ADD COLUMN     "nama_paguyuban" TEXT,
ADD COLUMN     "paguyuban" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "komitmen_target_mahasiswa_id_idx" ON "komitmen"("target_mahasiswa_id");

-- AddForeignKey
ALTER TABLE "komitmen" ADD CONSTRAINT "komitmen_target_mahasiswa_id_fkey" FOREIGN KEY ("target_mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
