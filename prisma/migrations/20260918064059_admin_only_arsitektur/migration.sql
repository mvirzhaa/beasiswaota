-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "mahasiswa" DROP CONSTRAINT "mahasiswa_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ortu_asuh" DROP CONSTRAINT "ortu_asuh_user_id_fkey";

-- DropForeignKey
ALTER TABLE "pesan_binaan" DROP CONSTRAINT "pesan_binaan_pengirim_id_fkey";

-- DropForeignKey
ALTER TABLE "pesan_binaan" DROP CONSTRAINT "pesan_binaan_relasi_asuh_id_fkey";

-- DropIndex
DROP INDEX "mahasiswa_user_id_key";

-- DropIndex
DROP INDEX "ortu_asuh_user_id_key";

-- AlterTable
ALTER TABLE "mahasiswa" DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "notifikasi" ADD COLUMN     "mahasiswa_id" TEXT,
ADD COLUMN     "ortu_asuh_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ortu_asuh" DROP COLUMN "user_id",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "kode_akses" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "relasi_asuh" DROP COLUMN "persetujuan_at",
DROP COLUMN "persetujuan_mahasiswa";

-- DropTable
DROP TABLE "pesan_binaan";

-- DropEnum
DROP TYPE "StatusPesan";

-- CreateIndex
CREATE INDEX "notifikasi_ortu_asuh_id_created_at_idx" ON "notifikasi"("ortu_asuh_id", "created_at");

-- CreateIndex
CREATE INDEX "notifikasi_mahasiswa_id_created_at_idx" ON "notifikasi"("mahasiswa_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ortu_asuh_kode_akses_key" ON "ortu_asuh"("kode_akses");

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_ortu_asuh_id_fkey" FOREIGN KEY ("ortu_asuh_id") REFERENCES "ortu_asuh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_mahasiswa_id_fkey" FOREIGN KEY ("mahasiswa_id") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

