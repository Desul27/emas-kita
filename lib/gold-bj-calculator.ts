// lib/gold-bj-calculator.ts
//
// Kalkulasi kadar emas via metode berat jenis (BJ), sesuai alat ukur
// yang dipakai toko. Notasi mengikuti kesepakatan:
//   Bk = Berat kering, Bb = Berat basah, Bj = Berat jenis
//   Kd = Kadar (%), Hp = Harga per gram, Th = Total harga

export interface HitungBjInput {
  beratKering: number; // Bk, dalam gram
  beratBasah: number; // Bb, dalam gram
}

/**
 * Hitung berat jenis (Bj) dari berat kering & berat basah.
 * Bj = Bk / (Bk - Bb)
 */
export function hitungBj({ beratKering, beratBasah }: HitungBjInput): number {
  if (beratKering <= 0) {
    throw new Error("Berat kering harus lebih besar dari 0");
  }
  if (beratBasah >= beratKering) {
    throw new Error(
      "Berat basah harus lebih kecil dari berat kering (barang jadi lebih ringan saat direndam air)"
    );
  }
  if (beratBasah <= 0) {
    throw new Error("Berat basah harus lebih besar dari 0");
  }

  return beratKering / (beratKering - beratBasah);
}

export interface ReferensiKadarRow {
  bj: number;
  kadarPersen: number;
}

/**
 * Cari kadar (%) dari nilai Bj hasil ukur, dengan interpolasi linear
 * di antara dua baris tabel referensi terdekat (karena Bj hasil ukur
 * biasanya tidak persis sama dengan nilai di tabel).
 *
 * `referensi` harus sudah terurut menaik berdasarkan bj, atau akan
 * diurutkan otomatis oleh fungsi ini.
 */
export function cariKadarDariBj(
  bj: number,
  referensi: ReferensiKadarRow[]
): number {
  if (referensi.length === 0) {
    throw new Error("Tabel referensi kadar kosong");
  }

  const sorted = [...referensi].sort((a, b) => a.bj - b.bj);

  const bjMin = sorted[0].bj;
  const bjMax = sorted[sorted.length - 1].bj;

  if (bj <= bjMin) return sorted[0].kadarPersen;
  if (bj >= bjMax) return sorted[sorted.length - 1].kadarPersen;

  // Cari dua baris yang mengapit nilai bj
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    if (bj >= a.bj && bj <= b.bj) {
      if (b.bj === a.bj) return a.kadarPersen; // jaga-jaga div by zero

      // Interpolasi linear
      const proporsi = (bj - a.bj) / (b.bj - a.bj);
      return a.kadarPersen + proporsi * (b.kadarPersen - a.kadarPersen);
    }
  }

  // Tidak seharusnya sampai sini kalau data valid
  throw new Error("Gagal menemukan kadar untuk nilai Bj: " + bj);
}

export interface HitungTotalHargaInput {
  beratKering: number; // Bk
  kadarPersen: number; // Kd, dalam persen (0-100)
  hargaPerGram: number; // Hp
}

/**
 * Hitung total harga.
 * Th = Bk * Kd * Hp   (Kd dikonversi dari persen ke desimal dulu)
 */
export function hitungTotalHarga({
  beratKering,
  kadarPersen,
  hargaPerGram,
}: HitungTotalHargaInput): number {
  const kd = kadarPersen / 100;
  return beratKering * kd * hargaPerGram;
}

export interface KalkulasiLengkapInput {
  beratKering: number;
  beratBasah: number;
  hargaPerGram: number;
  referensi: ReferensiKadarRow[];
}

export interface KalkulasiLengkapResult {
  bj: number;
  kadarPersen: number;
  totalHarga: number;
}

/**
 * Fungsi gabungan: dari 3 input (Bk, Bb, Hp) + tabel referensi,
 * langsung hasilkan Bj, Kd, dan Th sekaligus.
 */
export function kalkulasiLengkap({
  beratKering,
  beratBasah,
  hargaPerGram,
  referensi,
}: KalkulasiLengkapInput): KalkulasiLengkapResult {
  const bj = hitungBj({ beratKering, beratBasah });
  const kadarPersen = cariKadarDariBj(bj, referensi);
  const totalHarga = hitungTotalHarga({
    beratKering,
    kadarPersen,
    hargaPerGram,
  });

  return { bj, kadarPersen, totalHarga };
}