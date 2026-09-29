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

export interface AturanHitung {
  bulatkanBeratKering: boolean;
  bulatkanKadar: boolean;
}

/**
 * Berat kering dibulatkan ke bawah, 1 desimal (10,87 -> 10,8).
 * Epsilon kecil menahan galat floating point (mis. 4.6 * 10 = 45.99999...).
 */
export function bulatkanBeratKeringKeBawah(beratKering: number): number {
  return Math.floor(beratKering * 10 + 1e-9) / 10;
}

/**
 * Kadar <= 10% dibulatkan ke bawah ke bilangan bulat (9,6 -> 9).
 * Kadar di atas 10% tidak diubah.
 */
export function bulatkanKadarKeBawah(kadarPersen: number): number {
  return kadarPersen <= 10 ? Math.floor(kadarPersen + 1e-9) : kadarPersen;
}

export interface KalkulasiLengkapInput {
  beratKering: number;
  beratBasah: number;
  hargaEmasHarian: number; // harga dasar 24K per gram, dari Preferensi
  referensi: ReferensiKadarRow[];
  aturan: AturanHitung;
}

export interface KalkulasiLengkapResult {
  bj: number; // selalu dihitung dari berat asli timbangan
  beratKeringAsli: number; // hasil timbangan
  beratKering: number; // yang dipakai (sesudah aturan pembulatan)
  kadarAsli: number; // hasil lookup tabel
  kadarPersen: number; // yang dipakai (sesudah aturan pembulatan)
  hargaPerGramEfektif: number; // hargaEmasHarian x kadar
  totalHarga: number; // beratKering x hargaPerGramEfektif
}

export function kalkulasiLengkap({
  beratKering,
  beratBasah,
  hargaEmasHarian,
  referensi,
  aturan,
}: KalkulasiLengkapInput): KalkulasiLengkapResult {
  // Bj memakai berat asli; pembulatan baru dipakai sesudahnya
  const bj = hitungBj({ beratKering, beratBasah });
  const kadarAsli = cariKadarDariBj(bj, referensi);

  const beratDipakai = aturan.bulatkanBeratKering
    ? bulatkanBeratKeringKeBawah(beratKering)
    : beratKering;
  const kadarDipakai = aturan.bulatkanKadar
    ? bulatkanKadarKeBawah(kadarAsli)
    : kadarAsli;

  if (beratDipakai <= 0) {
    throw new Error("Berat kering menjadi 0 setelah pembulatan");
  }

  const hargaPerGramEfektif = hargaEmasHarian * (kadarDipakai / 100);
  const totalHarga = beratDipakai * hargaPerGramEfektif;

  return {
    bj,
    beratKeringAsli: beratKering,
    beratKering: beratDipakai,
    kadarAsli,
    kadarPersen: kadarDipakai,
    hargaPerGramEfektif,
    totalHarga,
  };
}