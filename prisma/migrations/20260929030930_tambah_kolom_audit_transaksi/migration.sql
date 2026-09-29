/*
  Warnings:

  - Added the required column `beratKeringAsli` to the `transaksi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kadarAsli` to the `transaksi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "toko" ADD COLUMN     "bulatkanBeratKering" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bulatkanKadar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cetakStruk" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "modeKalkulator" TEXT NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE "transaksi" ADD COLUMN "beratKeringAsli" DOUBLE PRECISION;
ALTER TABLE "transaksi" ADD COLUMN "kadarAsli" DOUBLE PRECISION;

-- Backfill 4 transaksi lama: pakai nilai yang sudah tersimpan sebagai "asli"
UPDATE "transaksi" SET "beratKeringAsli" = "beratKering" WHERE "beratKeringAsli" IS NULL;
UPDATE "transaksi" SET "kadarAsli" = "kadarPersen" WHERE "kadarAsli" IS NULL;

ALTER TABLE "transaksi" ALTER COLUMN "beratKeringAsli" SET NOT NULL;
ALTER TABLE "transaksi" ALTER COLUMN "kadarAsli" SET NOT NULL;
