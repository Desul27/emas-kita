// lib/auth/session.ts
// Sesi disimpan di database. Cookie hanya berisi token acak; yang disimpan di
// tabel "sesi" adalah SHA-256 dari token itu, jadi kebocoran DB tidak membocorkan sesi aktif.
// Menutup akses akun = hapus sesinya + status DITUTUP, berlaku seketika.

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

export const NAMA_COOKIE = "sesi";
const DURASI_JAM = 12;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function buatSesi(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const berlakuSampai = new Date(Date.now() + DURASI_JAM * 3600 * 1000);

  await prisma.sesi.create({
    data: { id: hashToken(token), userId, berlakuSampai },
  });
  // bersihkan sesi kedaluwarsa milik user ini
  await prisma.sesi.deleteMany({
    where: { userId, berlakuSampai: { lt: new Date() } },
  });

  (await cookies()).set(NAMA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: berlakuSampai,
  });
}

export async function hapusSesiSaatIni(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(NAMA_COOKIE)?.value;
  if (token) {
    await prisma.sesi.deleteMany({ where: { id: hashToken(token) } });
  }
  jar.delete(NAMA_COOKIE);
}

export interface PenggunaSesi {
  id: string;
  nama: string;
  username: string;
  role: Role;
}

/** Pengguna yang sedang login, atau null. Di-cache per request. */
export const ambilPengguna = cache(async (): Promise<PenggunaSesi | null> => {
  const token = (await cookies()).get(NAMA_COOKIE)?.value;
  if (!token) return null;

  const sesi = await prisma.sesi.findUnique({
    where: { id: hashToken(token) },
    select: {
      berlakuSampai: true,
      user: {
        select: { id: true, nama: true, username: true, role: true, status: true },
      },
    },
  });

  if (!sesi || sesi.berlakuSampai < new Date() || sesi.user.status !== "AKTIF") {
    return null;
  }
  const { id, nama, username, role } = sesi.user;
  return { id, nama, username, role };
});
