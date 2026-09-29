// lib/aturan-kalkulator.ts

export type ModeKalkulator = "default" | "kustom";

export interface AturanEfektif {
  bulatkanBeratKering: boolean; // berat kering dibulatkan ke bawah, 1 desimal
  bulatkanKadar: boolean; // kadar <= 10% dibulatkan ke bawah, bilangan bulat
  cetakStruk: boolean; // cetak struk otomatis saat simpan transaksi
}

// Bentuk yang tersimpan di tabel Toko
export interface AturanTersimpan extends AturanEfektif {
  modeKalkulator: string;
}

// Aturan standar toko: semua aktif
export const ATURAN_DEFAULT: AturanEfektif = {
  bulatkanBeratKering: true,
  bulatkanKadar: true,
  cetakStruk: true,
};

export function aturanEfektif(t: AturanTersimpan): AturanEfektif {
  if (t.modeKalkulator !== "kustom") return ATURAN_DEFAULT;
  return {
    bulatkanBeratKering: t.bulatkanBeratKering,
    bulatkanKadar: t.bulatkanKadar,
    cetakStruk: t.cetakStruk,
  };
}