-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'KASIR');

-- CreateEnum
CREATE TYPE "JenisBarang" AS ENUM ('PERHIASAN', 'BATANGAN');

-- CreateTable
CREATE TABLE "toko" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "toko_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KASIR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tokoId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barang" (
    "id" TEXT NOT NULL,
    "kodeBarang" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" "JenisBarang" NOT NULL,
    "karat" INTEGER NOT NULL,
    "kadar" DOUBLE PRECISION NOT NULL,
    "beratGram" DOUBLE PRECISION NOT NULL,
    "ongkosKerja" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tokoId" TEXT NOT NULL,

    CONSTRAINT "barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harga_emas_harian" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hargaPerGram" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokoId" TEXT NOT NULL,

    CONSTRAINT "harga_emas_harian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referensi_kadar" (
    "id" TEXT NOT NULL,
    "bj" DOUBLE PRECISION NOT NULL,
    "kadarPersen" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "referensi_kadar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tokoId_idx" ON "users"("tokoId");

-- CreateIndex
CREATE UNIQUE INDEX "barang_kodeBarang_key" ON "barang"("kodeBarang");

-- CreateIndex
CREATE INDEX "barang_tokoId_idx" ON "barang"("tokoId");

-- CreateIndex
CREATE INDEX "harga_emas_harian_tokoId_idx" ON "harga_emas_harian"("tokoId");

-- CreateIndex
CREATE UNIQUE INDEX "harga_emas_harian_tokoId_tanggal_key" ON "harga_emas_harian"("tokoId", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "referensi_kadar_bj_key" ON "referensi_kadar"("bj");

-- CreateIndex
CREATE INDEX "referensi_kadar_bj_idx" ON "referensi_kadar"("bj");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tokoId_fkey" FOREIGN KEY ("tokoId") REFERENCES "toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barang" ADD CONSTRAINT "barang_tokoId_fkey" FOREIGN KEY ("tokoId") REFERENCES "toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_emas_harian" ADD CONSTRAINT "harga_emas_harian_tokoId_fkey" FOREIGN KEY ("tokoId") REFERENCES "toko"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
