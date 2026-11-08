// lib/auth/guard.ts
// Penjaga akses. Dipanggil di DALAM setiap halaman dan server action
// (proxy.ts hanya pemeriksaan awal; yang menentukan adalah guard ini).

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ambilPengguna, type PenggunaSesi } from "@/lib/auth/session";

/** Untuk halaman: belum login -> /login. */
export async function wajibLogin(): Promise<PenggunaSesi> {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/login");
  return pengguna;
}

/** Untuk halaman khusus Pemilik Toko; Super Admin dialihkan ke dashboard. */
export async function wajibPemilikHalaman(): Promise<PenggunaSesi> {
  const pengguna = await wajibLogin();
  if (pengguna.role !== "PEMILIK_TOKO") redirect("/dashboard");
  return pengguna;
}

/** Untuk server action Pemilik Toko: melempar error, bukan redirect. */
export async function wajibPemilik(): Promise<PenggunaSesi> {
  const pengguna = await ambilPengguna();
  if (!pengguna) throw new Error("Sesi berakhir, silakan login lagi.");
  if (pengguna.role !== "PEMILIK_TOKO") throw new Error("Tidak berwenang.");
  return pengguna;
}

/** Pastikan toko ini milik pengguna. Tanpa ini, tokoId dari klien tidak boleh dipercaya. */
export async function pastikanTokoMilik(
  penggunaId: string,
  tokoId: string
): Promise<void> {
  const toko = await prisma.toko.findFirst({
    where: { id: tokoId, ownerId: penggunaId },
    select: { id: true },
  });
  if (!toko) throw new Error("Toko tidak ditemukan.");
}
