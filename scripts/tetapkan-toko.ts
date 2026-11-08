// scripts/tetapkan-toko.ts
// Menetapkan pemilik untuk toko lama yang belum punya pemilik (dibuat sebelum
// ada login). Jalankan: npx tsx scripts/tetapkan-toko.ts <username-pemilik>

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.argv[2]?.trim().toLowerCase();
  if (!username) throw new Error("Pemakaian: npx tsx scripts/tetapkan-toko.ts <username>");

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`User "${username}" tidak ditemukan.`);
  if (user.role !== "PEMILIK_TOKO") throw new Error("User ini bukan Pemilik Toko.");

  const hasil = await prisma.toko.updateMany({
    where: { ownerId: null },
    data: { ownerId: user.id },
  });
  console.log(`${hasil.count} toko ditetapkan ke "${username}".`);
}

main()
  .catch((e) => {
    console.error("Gagal:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
