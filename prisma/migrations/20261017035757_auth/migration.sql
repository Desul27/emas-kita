/*
  Warnings:

  - The values [ADMIN,KASIR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tokoId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusAkun" AS ENUM ('AKTIF', 'DITUTUP');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'PEMILIK_TOKO');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PEMILIK_TOKO';
COMMIT;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tokoId_fkey";

-- DropIndex
DROP INDEX "users_tokoId_idx";

-- AlterTable
ALTER TABLE "toko" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "tokoId",
ADD COLUMN     "gagalLogin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "status" "StatusAkun" NOT NULL DEFAULT 'AKTIF',
ADD COLUMN     "terkunciSampai" TIMESTAMP(3),
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'PEMILIK_TOKO';

-- CreateTable
CREATE TABLE "sesi" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "berlakuSampai" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sesi_userId_idx" ON "sesi"("userId");

-- CreateIndex
CREATE INDEX "toko_ownerId_idx" ON "toko"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "toko" ADD CONSTRAINT "toko_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi" ADD CONSTRAINT "sesi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
