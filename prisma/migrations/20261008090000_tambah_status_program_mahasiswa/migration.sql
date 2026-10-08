-- AlterTable
ALTER TABLE "mahasiswa" ADD COLUMN     "status_program" TEXT NOT NULL DEFAULT 'AKTIF';

-- CreateIndex
CREATE INDEX "mahasiswa_status_program_idx" ON "mahasiswa"("status_program");
