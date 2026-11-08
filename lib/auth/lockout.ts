// lib/auth/lockout.ts
// Pembatasan percobaan login (anti brute force).
// 3 kali gagal beruntun -> akun dijeda 1 menit; setiap kegagalan berikutnya
// menggandakan jeda (2, 4, 8 menit ...) sampai maksimal 15 menit.
// Update dilakukan dalam SATU query SQL supaya aman dari permintaan paralel
// (penyerang tidak bisa menembus batas dengan mengirim banyak request sekaligus).

import { prisma } from "@/lib/prisma";

export const BATAS_GAGAL = 3;
const JEDA_DASAR_DETIK = 60;
const JEDA_MAKS_DETIK = 15 * 60;

/** Catat satu kegagalan login. Mengembalikan sisa detik jeda (0 = belum dikunci). */
export async function catatGagalLogin(userId: string): Promise<number> {
  const baris = await prisma.$queryRaw<{ sisa: number }[]>`
    UPDATE "users"
    SET "gagalLogin" = "gagalLogin" + 1,
        "terkunciSampai" = CASE
          WHEN "gagalLogin" + 1 >= ${BATAS_GAGAL}::int
          THEN now() + make_interval(secs => LEAST(
                 ${JEDA_MAKS_DETIK}::int,
                 (${JEDA_DASAR_DETIK}::int * power(2, "gagalLogin" + 1 - ${BATAS_GAGAL}::int))::int
               ))
          ELSE "terkunciSampai"
        END
    WHERE "id" = ${userId}
    RETURNING GREATEST(0, CEIL(EXTRACT(EPOCH FROM ("terkunciSampai" - now()))))::int AS sisa
  `;
  return baris[0]?.sisa ?? 0;
}

export async function resetGagalLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { gagalLogin: 0, terkunciSampai: null },
  });
}

/** Sisa detik jeda dari nilai terkunciSampai (0 jika tidak sedang dikunci). */
export function sisaDetikKunci(terkunciSampai: Date | null): number {
  if (!terkunciSampai) return 0;
  const sisa = Math.ceil((terkunciSampai.getTime() - Date.now()) / 1000);
  return sisa > 0 ? sisa : 0;
}
