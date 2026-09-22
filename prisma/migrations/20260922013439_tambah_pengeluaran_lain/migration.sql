-- AlterTable
ALTER TABLE "dana_ledger" ADD COLUMN     "pengeluaran_lain_id" TEXT;

-- CreateTable
CREATE TABLE "pengeluaran_lain" (
    "id" TEXT NOT NULL,
    "periode_id" TEXT NOT NULL,
    "nominal" BIGINT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "dicatat_oleh_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengeluaran_lain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pengeluaran_lain_periode_id_created_at_idx" ON "pengeluaran_lain"("periode_id", "created_at");

-- AddForeignKey
ALTER TABLE "dana_ledger" ADD CONSTRAINT "dana_ledger_pengeluaran_lain_id_fkey" FOREIGN KEY ("pengeluaran_lain_id") REFERENCES "pengeluaran_lain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengeluaran_lain" ADD CONSTRAINT "pengeluaran_lain_periode_id_fkey" FOREIGN KEY ("periode_id") REFERENCES "periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
