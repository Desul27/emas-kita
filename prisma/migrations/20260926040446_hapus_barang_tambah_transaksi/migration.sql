/*
  Warnings:

  - You are about to drop the `barang` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "barang" DROP CONSTRAINT "barang_tokoId_fkey";

-- DropTable
DROP TABLE "barang";

-- DropEnum
DROP TYPE "JenisBarang";

-- CreateTable
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL,
    "kodeTransaksi" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "beratKering" DOUBLE PRECISION NOT NULL,
    "beratBasah" DOUBLE PRECISION NOT NULL,
    "bj" DOUBLE PRECISION NOT NULL,
    "kadarPersen" DOUBLE PRECISION NOT NULL,
    "hargaPerGram" DOUBLE PRECISION NOT NULL,
    "totalHarga" DOUBLE PRECISION NOT NULL,
    "namaPelanggan" TEXT,
    "tokoId" TEXT NOT NULL,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_kodeTransaksi_key" ON "transaksi"("kodeTransaksi");

-- CreateIndex
CREATE INDEX "transaksi_tokoId_tanggal_idx" ON "transaksi"("tokoId", "tanggal");

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_tokoId_fkey" FOREIGN KEY ("tokoId") REFERENCES "toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
