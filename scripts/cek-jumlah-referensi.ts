// scripts/cek-jumlah-referensi.ts
// Cek cepat jumlah baris di tabel ReferensiKadar.
// Jalankan: npx tsx scripts/cek-jumlah-referensi.ts

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const jumlah = await prisma.referensiKadar.count();
  console.log(`Jumlah baris di referensi_kadar: ${jumlah}`);

  const min = await prisma.referensiKadar.findFirst({ orderBy: { bj: "asc" } });
  const max = await prisma.referensiKadar.findFirst({ orderBy: { bj: "desc" } });
  console.log(`Rentang BJ: ${min?.bj} - ${max?.bj}`);
}

main().finally(() => prisma.$disconnect());