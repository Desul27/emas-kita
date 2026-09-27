// lib/gold-bj-calculator.ts

export interface HitungBjInput {
  beratKering: number;
  beratBasah: number;
}

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

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (bj >= a.bj && bj <= b.bj) {
      if (b.bj === a.bj) return a.kadarPersen;
      const proporsi = (bj - a.bj) / (b.bj - a.bj);
      return a.kadarPersen + proporsi * (b.kadarPersen - a.kadarPersen);
    }
  }

  throw new Error("Gagal menemukan kadar untuk nilai Bj: " + bj);
}

export interface KalkulasiLengkapInput {
  beratKering: number;
  beratBasah: number;
  hargaEmasHarian: number; // harga dasar 24K per gram, dari Preferensi
  referensi: ReferensiKadarRow[];
}

export interface KalkulasiLengkapResult {
  bj: number;
  kadarPersen: number;
  hargaPerGramEfektif: number; // hargaEmasHarian x kadar
  totalHarga: number; // beratKering x hargaPerGramEfektif
}

export function kalkulasiLengkap({
  beratKering,
  beratBasah,
  hargaEmasHarian,
  referensi,
}: KalkulasiLengkapInput): KalkulasiLengkapResult {
  const bj = hitungBj({ beratKering, beratBasah });
  const kadarPersen = cariKadarDariBj(bj, referensi);
  const hargaPerGramEfektif = hargaEmasHarian * (kadarPersen / 100);
  const totalHarga = beratKering * hargaPerGramEfektif;

  return { bj, kadarPersen, hargaPerGramEfektif, totalHarga };
}