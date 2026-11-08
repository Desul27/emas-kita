// lib/auth/password.ts
// Hash PIN/kata sandi: HMAC-SHA256 dengan "pepper" (rahasia di .env, tidak ada
// di database) lalu scrypt dengan salt acak. Kalau database bocor, PIN 6 digit
// tidak bisa ditebak offline tanpa pepper.

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 128 * 1024 * 1024;

function ambilPepper(): string {
  const pepper = process.env.AUTH_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error(
      "AUTH_PEPPER belum diisi di .env (minimal 32 karakter). Buat dengan: openssl rand -base64 48"
    );
  }
  return pepper;
}

function praHash(rahasia: string): Buffer {
  return createHmac("sha256", ambilPepper()).update(rahasia).digest();
}

function scryptAsync(input: Buffer, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(input, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function hashRahasia(rahasia: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(praHash(rahasia), salt);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function cocokkanRahasia(
  rahasia: string,
  tersimpan: string
): Promise<boolean> {
  const bagian = tersimpan.split("$");
  if (bagian.length !== 6 || bagian[0] !== "scrypt") return false;
  const salt = Buffer.from(bagian[4], "base64");
  const asli = Buffer.from(bagian[5], "base64");
  const key = await scryptAsync(praHash(rahasia), salt);
  return key.length === asli.length && timingSafeEqual(key, asli);
}

// Hash palsu untuk menyamakan waktu respons saat username tidak ditemukan
// (supaya penyerang tidak bisa membedakan "username ada" vs "tidak ada").
let hashPalsu: Promise<string> | null = null;
export function ambilHashPalsu(): Promise<string> {
  hashPalsu ??= hashRahasia("hash-palsu-tidak-dipakai");
  return hashPalsu;
}
