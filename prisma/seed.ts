// prisma/seed.ts
//
// Baca data dari prisma/data/referensi-kadar.txt (format per baris:
// bj,kadarPersen -- pemisah koma atau spasi/tab, keduanya diterima)
// lalu masukkan ke tabel ReferensiKadar di database.
//
// Jalankan dengan: npm run seed

import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(__dirname, "data", "referensi-kadar.txt");
  const raw = readFileSync(filePath, "utf-8");

  const errorBaris: string[] = [];

  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    // pemisah: koma, atau satu/lebih spasi/tab
    .map((line) => {
      const parts = line.split(/[,\s]+/).filter(Boolean);
      if (parts.length !== 2) {
        errorBaris.push(line);
        return null;
      }
      const bj = parseFloat(parts[0]);
      const kadarPersen = parseFloat(parts[1]);
      if (isNaN(bj) || isNaN(kadarPersen)) {
        errorBaris.push(line);
        return null;
      }
      return { bj, kadarPersen };
    })
    .filter((row): row is { bj: number; kadarPersen: number } => row !== null);

  if (errorBaris.length > 0) {
    console.warn(`Melewati ${errorBaris.length} baris yang tidak valid:`);
    errorBaris.forEach((l) => console.warn("  -", l));
  }

  console.log(`Ditemukan ${rows.length} baris data valid. Mulai import...`);

  const result = await prisma.referensiKadar.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`Berhasil import ${result.count} baris.`);
}

main()
  .catch((err) => {
    console.error("Gagal seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });