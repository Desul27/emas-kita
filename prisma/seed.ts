// prisma/seed.ts
//
// Baca data dari prisma/data/referensi-kadar.txt (format: bj,kadarPersen
// per baris) lalu masukkan ke tabel ReferensiKadar di database.
//
// Jalankan dengan: npm run seed

import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// console.log("DATABASE_URL ada?", !!process.env.DATABASE_URL);
// console.log("Host:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(__dirname, "data", "referensi-kadar.txt");
  const raw = readFileSync(filePath, "utf-8");

  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [bjStr, kadarStr] = line.split(",").map((s) => s.trim());
      const bj = parseFloat(bjStr);
      const kadarPersen = parseFloat(kadarStr);

      if (isNaN(bj) || isNaN(kadarPersen)) {
        throw new Error(`Baris tidak valid: "${line}"`);
      }

      return { bj, kadarPersen };
    });

  console.log(`Ditemukan ${rows.length} baris data. Mulai import...`);

  const result = await prisma.referensiKadar.createMany({
    data: rows,
    skipDuplicates: true, // aman kalau script dijalankan ulang
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