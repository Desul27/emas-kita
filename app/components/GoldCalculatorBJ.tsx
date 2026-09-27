"use client";

import { useState, useTransition, useEffect } from "react";
import {
  ambilDaftarToko,
  buatToko,
  ambilHargaTerbaru,
  hitungKalkulatorBj,
  simpanTransaksi,
  ambilStokHariIni,
  type TokoRow,
} from "@/app/kalkulator/actions";
import type { KalkulasiLengkapResult } from "@/lib/gold-bj-calculator";

const NILAI_AWAL = { beratKering: "", beratBasah: "", namaPelanggan: "" };

export default function GoldCalculatorBJ() {
  const [daftarToko, setDaftarToko] = useState<TokoRow[]>([]);
  const [tokoId, setTokoId] = useState("");
  const [namaTokoBaru, setNamaTokoBaru] = useState("");

  const [beratKering, setBeratKering] = useState(NILAI_AWAL.beratKering);
  const [beratBasah, setBeratBasah] = useState(NILAI_AWAL.beratBasah);
  const [namaPelanggan, setNamaPelanggan] = useState(NILAI_AWAL.namaPelanggan);

  const [hargaHariIni, setHargaHariIni] = useState<number | null>(null);
  const [stok, setStok] = useState<{ totalGram: number; jumlahTransaksi: number } | null>(null);

  const [hasil, setHasil] = useState<KalkulasiLengkapResult | null>(null);
  const [kodeTersimpan, setKodeTersimpan] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    startTransition(async () => {
      const list = await ambilDaftarToko();
      setDaftarToko(list);
      if (list.length > 0) setTokoId(list[0].id);
    });
  }, []);

  const muatHargaDanStok = (id: string) => {
    startTransition(async () => {
      const harga = await ambilHargaTerbaru(id);
      setHargaHariIni(harga ? harga.hargaPerGram : null);
      const s = await ambilStokHariIni(id);
      setStok(s);
    });
  };

  useEffect(() => {
    if (!tokoId) return;
    muatHargaDanStok(tokoId);
  }, [tokoId]);

  const handleBuatToko = () => {
    setError(null);
    startTransition(async () => {
      try {
        const toko = await buatToko(namaTokoBaru);
        setNamaTokoBaru("");
        setDaftarToko((prev) => [...prev, toko]);
        setTokoId(toko.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat toko");
      }
    });
  };

  const resetForm = () => {
    setBeratKering(NILAI_AWAL.beratKering);
    setBeratBasah(NILAI_AWAL.beratBasah);
    setNamaPelanggan(NILAI_AWAL.namaPelanggan);
    setHasil(null);
    setKodeTersimpan(null);
    setError(null);
  };

  const handleHitung = () => {
    setError(null);
    setHasil(null);
    setKodeTersimpan(null);

    const bk = parseFloat(beratKering);
    const bb = parseFloat(beratBasah);

    if (isNaN(bk) || isNaN(bb)) {
      setError("Berat kering dan berat basah harus diisi angka");
      return;
    }
    if (!tokoId) {
      setError("Pilih toko dulu");
      return;
    }

    startTransition(async () => {
      const res = await hitungKalkulatorBj({ tokoId, beratKering: bk, beratBasah: bb });
      if (res.ok) setHasil(res.data);
      else setError(res.error);
    });
  };

  const handleSimpanTransaksi = () => {
    setError(null);
    const bk = parseFloat(beratKering);
    const bb = parseFloat(beratBasah);

    startTransition(async () => {
      const res = await simpanTransaksi({ tokoId, beratKering: bk, beratBasah: bb, namaPelanggan });
      if (res.ok) {
        setKodeTersimpan(res.kodeTransaksi);
        muatHargaDanStok(tokoId);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="max-w-sm mx-auto p-4 space-y-4 text-gray-900">
      {daftarToko.length === 0 && !isPending && (
        <div className="border rounded p-4 space-y-2 bg-white">
          <p className="text-sm text-gray-600">Belum ada toko. Buat dulu:</p>
          <input type="text" placeholder="Nama toko" value={namaTokoBaru}
            onChange={(e) => setNamaTokoBaru(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900" />
          <button onClick={handleBuatToko} className="w-full bg-black text-white rounded py-2">
            Buat toko
          </button>
        </div>
      )}

      {daftarToko.length > 0 && (
        <>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Toko</label>
            <select value={tokoId} onChange={(e) => setTokoId(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white text-gray-900">
              {daftarToko.map((t) => (
                <option key={t.id} value={t.id}>{t.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700">Harga emas hari ini (per gram, 24K)</label>
            <input
              type="text"
              readOnly
              value={hargaHariIni !== null ? formatRupiah(hargaHariIni) : "Belum diset"}
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            {hargaHariIni === null && (
              <p className="text-xs text-red-700 mt-1">
                Set harga dulu di halaman Preferensi sebelum transaksi.
              </p>
            )}
          </div>

          {stok && (
            <p className="text-sm text-gray-600">
              Stok terkumpul hari ini: {stok.totalGram.toFixed(2)} gram ({stok.jumlahTransaksi} transaksi)
            </p>
          )}

          {!kodeTersimpan && (
            <>
              <div>
                <label className="block text-sm mb-1 text-gray-700">Berat kering (Bk) - gram</label>
                <input type="number" step={0.01} value={beratKering}
                  onChange={(e) => setBeratKering(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white text-gray-900" />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Berat basah (Bb) - gram</label>
                <input type="number" step={0.01} value={beratBasah}
                  onChange={(e) => setBeratBasah(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white text-gray-900" />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Nama/ID pelanggan</label>
                <input type="text" value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white text-gray-900" />
              </div>

              <button onClick={handleHitung} disabled={isPending}
                className="w-full bg-gray-200 text-gray-900 rounded py-2 disabled:opacity-50">
                Hitung
              </button>
            </>
          )}

          {hasil && !kodeTersimpan && (
            <div className="bg-gray-100 rounded p-4 space-y-2 text-gray-900">
              <div>
                <p className="text-sm text-gray-600">Berat kering</p>
                <p className="font-medium text-gray-900">{parseFloat(beratKering)} gram</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kadar</p>
                <p className="font-medium text-gray-900">{hasil.kadarPersen.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Harga emas per gram</p>
                <p className="font-medium text-gray-900">{formatRupiah(hasil.hargaPerGramEfektif)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total harga</p>
                <p className="text-2xl font-semibold text-gray-900">{formatRupiah(hasil.totalHarga)}</p>
              </div>
              {namaPelanggan && (
                <div>
                  <p className="text-sm text-gray-600">Nama pelanggan</p>
                  <p className="font-medium text-gray-900">{namaPelanggan}</p>
                </div>
              )}

              <button onClick={handleSimpanTransaksi} disabled={isPending}
                className="w-full bg-black text-white rounded py-2 disabled:opacity-50">
                {isPending ? "Menyimpan..." : "Simpan sebagai transaksi"}
              </button>
            </div>
          )}

          {kodeTersimpan && hasil && (
            <div className="bg-green-50 rounded p-4 space-y-2">
              <p className="text-green-800 text-sm">
                Transaksi tersimpan: <strong>{kodeTersimpan}</strong>
              </p>
              <div>
                <p className="text-sm text-gray-600">Berat kering</p>
                <p className="font-medium text-gray-900">{parseFloat(beratKering)} gram</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kadar</p>
                <p className="font-medium text-gray-900">{hasil.kadarPersen.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Harga emas per gram</p>
                <p className="font-medium text-gray-900">{formatRupiah(hasil.hargaPerGramEfektif)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total harga</p>
                <p className="text-2xl font-semibold text-gray-900">{formatRupiah(hasil.totalHarga)}</p>
              </div>
              {namaPelanggan && (
                <div>
                  <p className="text-sm text-gray-600">Nama pelanggan</p>
                  <p className="font-medium text-gray-900">{namaPelanggan}</p>
                </div>
              )}

              <button onClick={resetForm}
                className="w-full bg-black text-white rounded py-2">
                Tambah transaksi
              </button>
            </div>
          )}
        </>
      )}

      {error && <div className="bg-red-50 text-red-800 text-sm rounded p-3">{error}</div>}
    </div>
  );
}