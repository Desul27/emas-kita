// scripts/buat-pengguna.ts
// Membuat akun lewat terminal (dipakai untuk Super Admin pertama, dan untuk
// membuat Pemilik Toko sebelum halaman Super Admin selesai).
// PIN/kata sandi diketik tersembunyi dan hanya disimpan sebagai hash.
//
// Jalankan: npx tsx scripts/buat-pengguna.ts

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { tanya, tanyaRahasia, tutupInput } from "./_input";
import { hashRahasia } from "../lib/auth/password";
import {
  normalisasiIdentitas,
  validasiEmail,
  validasiKataSandi,
  validasiPin,
  validasiUsername,
} from "../lib/auth/validasi";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function ulangiSampaiValid(
  pertanyaan: string,
  validasi: (nilai: string) => string | null,
  opsi: { rahasia?: boolean; normalisasi?: boolean } = {}
): Promise<string> {
  for (;;) {
    const mentah = opsi.rahasia ? await tanyaRahasia(pertanyaan) : await tanya(pertanyaan);
    const nilai = opsi.normalisasi ? normalisasiIdentitas(mentah) : mentah;
    const galat = validasi(nilai);
    if (!galat) return nilai;
    console.log(`  ! ${galat}`);
  }
}

async function main() {
  console.log("\n=== Buat akun Emas Kita ===\n");
  const jenis = await ulangiSampaiValid(
    "Jenis akun (1 = Super Admin, 2 = Pemilik Toko): ",
    (v) => (v === "1" || v === "2" ? null : "Ketik 1 atau 2.")
  );
  const superAdmin = jenis === "1";

  const username = await ulangiSampaiValid("Username: ", validasiUsername, {
    normalisasi: true,
  });
  if (await prisma.user.findUnique({ where: { username } })) {
    throw new Error(`Username "${username}" sudah dipakai.`);
  }

  let email: string | null = null;
  if (superAdmin) {
    email = await ulangiSampaiValid("Email (untuk ganti kata sandi): ", validasiEmail, {
      normalisasi: true,
    });
  } else {
    const opsional = normalisasiIdentitas(await tanya("Email (boleh kosong): "));
    if (opsional) {
      const galat = validasiEmail(opsional);
      if (galat) throw new Error(galat);
      email = opsional;
    }
  }
  if (email && (await prisma.user.findUnique({ where: { email } }))) {
    throw new Error(`Email "${email}" sudah dipakai.`);
  }

  const nama = (await tanya("Nama lengkap: ")).trim();
  if (!nama) throw new Error("Nama tidak boleh kosong.");

  let rahasia: string;
  for (;;) {
    rahasia = await ulangiSampaiValid(
      superAdmin ? "Kata sandi (min 12 karakter): " : "PIN (6 digit angka): ",
      superAdmin ? validasiKataSandi : validasiPin,
      { rahasia: true }
    );
    const ulang = await tanyaRahasia("Ulangi: ");
    if (ulang === rahasia) break;
    console.log("  ! Tidak sama, ulangi.");
  }

  const user = await prisma.user.create({
    data: {
      username,
      email,
      nama,
      role: superAdmin ? "SUPER_ADMIN" : "PEMILIK_TOKO",
      passwordHash: await hashRahasia(rahasia),
    },
  });
  console.log(`\nBerhasil. Akun ${user.role} "${user.username}" dibuat.`);
}

main()
  .catch((e) => {
    console.error("\nGagal:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    tutupInput();
    await prisma.$disconnect();
  });
