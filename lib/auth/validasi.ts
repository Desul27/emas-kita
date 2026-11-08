// lib/auth/validasi.ts
// Aturan format kredensial. Dipakai script pembuat akun (dan nanti halaman
// Super Admin), bukan di form login (login hanya membandingkan).

export const POLA_USERNAME = /^[a-z0-9_.-]{3,30}$/;
export const POLA_PIN = /^\d{6}$/;
export const PANJANG_MIN_KATA_SANDI = 12;

export function normalisasiIdentitas(nilai: string): string {
  return nilai.trim().toLowerCase();
}

export function validasiUsername(username: string): string | null {
  if (!POLA_USERNAME.test(username)) {
    return "Username 3-30 karakter: huruf kecil, angka, titik, strip, atau garis bawah.";
  }
  return null;
}

export function validasiEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Format email tidak valid.";
}

export function validasiPin(pin: string): string | null {
  if (!POLA_PIN.test(pin)) return "PIN harus 6 digit angka.";
  if (/^(\d)\1{5}$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) {
    return "PIN terlalu mudah ditebak (mis. 111111 atau 123456).";
  }
  return null;
}

export function validasiKataSandi(kataSandi: string): string | null {
  return kataSandi.length >= PANJANG_MIN_KATA_SANDI
    ? null
    : `Kata sandi minimal ${PANJANG_MIN_KATA_SANDI} karakter.`;
}
