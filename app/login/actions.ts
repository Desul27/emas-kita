"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ambilHashPalsu, cocokkanRahasia } from "@/lib/auth/password";
import { normalisasiIdentitas } from "@/lib/auth/validasi";
import {
  catatGagalLogin,
  resetGagalLogin,
  sisaDetikKunci,
} from "@/lib/auth/lockout";
import { buatSesi, hapusSesiSaatIni } from "@/lib/auth/session";

export interface LoginState {
  error?: string;
  sisaDetik?: number;
}

const PESAN_SALAH = "Username/email atau PIN/kata sandi salah.";

function pesanJeda(detik: number): string {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  const teks = menit > 0 ? `${menit} menit ${sisa} detik` : `${sisa} detik`;
  return `Terlalu banyak percobaan gagal. Coba lagi dalam ${teks}.`;
}

export async function masuk(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identitas = normalisasiIdentitas(String(formData.get("identitas") ?? ""));
  const rahasia = String(formData.get("rahasia") ?? "");

  if (!identitas || !rahasia || rahasia.length > 200) {
    return { error: PESAN_SALAH };
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identitas }, { email: identitas }] },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      terkunciSampai: true,
    },
  });

  // Username tidak ada: tetap kerjakan hash supaya waktu respons sama.
  if (!user) {
    await cocokkanRahasia(rahasia, await ambilHashPalsu());
    return { error: PESAN_SALAH };
  }

  // Sedang dijeda: tolak tanpa memeriksa kata sandi (dan tidak menambah hitungan).
  const jeda = sisaDetikKunci(user.terkunciSampai);
  if (jeda > 0) {
    return { error: pesanJeda(jeda), sisaDetik: jeda };
  }

  const cocok = await cocokkanRahasia(rahasia, user.passwordHash);
  if (!cocok) {
    const sisa = await catatGagalLogin(user.id);
    return sisa > 0 ? { error: pesanJeda(sisa), sisaDetik: sisa } : { error: PESAN_SALAH };
  }

  if (user.status !== "AKTIF") {
    return { error: "Akses akun ini sedang ditutup. Hubungi administrator." };
  }

  await resetGagalLogin(user.id);
  await buatSesi(user.id);
  redirect("/dashboard");
}

export async function keluar(): Promise<void> {
  await hapusSesiSaatIni();
  redirect("/login");
}
