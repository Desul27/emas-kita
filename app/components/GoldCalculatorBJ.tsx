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
import Struk, { type StrukProps } from "../components/Struk";

const NILAI_AWAL = { beratKering: "", beratBasah: "", namaPelanggan: "" };

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function RingkasanHasil({
  hasil,
  namaPelanggan,
}: {
  hasil: KalkulasiLengkapResult;
  namaPelanggan: string;
}) {
  const beratBeda = hasil.beratKering !== hasil.beratKeringAsli;
  const kadarBeda = hasil.kadarPersen !== hasil.kadarAsli;

  return (
    <>
      <div>
        <p className="muted">Berat kering</p>
        <p className="font-medium">{hasil.beratKering} gram</p>
        {beratBeda && <p className="muted">Timbangan: {hasil.beratKeringAsli} gram</p>}
      </div>
      <div>
        <p className="muted">Kadar</p>
        <p className="font-medium">{hasil.kadarPersen.toFixed(2)}%</p>
        {kadarBeda && <p className="muted">Tabel: {hasil.kadarAsli.toFixed(2)}%</p>}
      </div>
      <div>
        <p className="muted">Harga emas per gram</p>
        <p className="font-medium">{formatRupiah(hasil.hargaPerGramEfektif)}</p>
      </div>
      <div>
        <p className="muted">Total harga</p>
        <p className="text-2xl font-semibold">{formatRupiah(hasil.totalHarga)}</p>
      </div>
      {namaPelanggan && (
        <div>
          <p className="muted">Nama pelanggan</p>
          <p className="font-medium">{namaPelanggan}</p>
        </div>
      )}
    </>
  );
}

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
  const [strukData, setStrukData] = useState<StrukProps | null>(null);
  const [cetakOtomatis, setCetakOtomatis] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  // Cetak otomatis (kalau aturannya aktif) begitu struk sudah tampil di DOM
  useEffect(() => {
    if (strukData && cetakOtomatis) window.print();
  }, [strukData, cetakOtomatis]);

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
    setStrukData(null);
    setCetakOtomatis(false);
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
    const namaToko = daftarToko.find((t) => t.id === tokoId)?.nama ?? "Emas Kita";

    startTransition(async () => {
      const res = await simpanTransaksi({ tokoId, beratKering: bk, beratBasah: bb, namaPelanggan });
      if (res.ok) {
        setHasil(res.data);
        setKodeTersimpan(res.kodeTransaksi);
        setStrukData({
          namaToko,
          kodeTransaksi: res.kodeTransaksi,
          tanggal: res.tanggal,
          namaPelanggan: namaPelanggan.trim() || undefined,
          beratKering: res.data.beratKering,
          kadarPersen: res.data.kadarPersen,
          hargaPerGram: res.data.hargaPerGramEfektif,
          totalHarga: res.data.totalHarga,
        });
        setCetakOtomatis(res.cetakStruk);
        muatHargaDanStok(tokoId);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 p-4">
      {daftarToko.length === 0 && !isPending && (
        <div className="card space-y-2">
          <p className="muted">Belum ada toko. Buat dulu:</p>
          <input
            type="text"
            placeholder="Nama toko"
            value={namaTokoBaru}
            onChange={(e) => setNamaTokoBaru(e.target.value)}
            className="field"
          />
          <button onClick={handleBuatToko} className="btn-primary">Buat toko</button>
        </div>
      )}

      {daftarToko.length > 0 && (
        <>
          <div>
            <label className="label">Toko</label>
            <select value={tokoId} onChange={(e) => setTokoId(e.target.value)} className="field">
              {daftarToko.map((t) => (
                <option key={t.id} value={t.id}>{t.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Harga emas hari ini (per gram, 24K)</label>
            <input
              type="text"
              readOnly
              value={hargaHariIni !== null ? formatRupiah(hargaHariIni) : "Belum diset"}
              className="field field-readonly"
            />
            {hargaHariIni === null && (
              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                Set harga dulu di halaman Preferensi sebelum transaksi.
              </p>
            )}
          </div>

          {stok && (
            <p className="muted">
              Stok terkumpul hari ini: {stok.totalGram.toFixed(2)} gram ({stok.jumlahTransaksi} transaksi)
            </p>
          )}

          {!kodeTersimpan && (
            <>
              <div>
                <label className="label">Berat kering (Bk) - gram</label>
                <input
                  type="number"
                  step={0.01}
                  value={beratKering}
                  onChange={(e) => setBeratKering(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="label">Berat basah (Bb) - gram</label>
                <input
                  type="number"
                  step={0.01}
                  value={beratBasah}
                  onChange={(e) => setBeratBasah(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="label">Nama/ID pelanggan</label>
                <input
                  type="text"
                  value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                  className="field"
                />
              </div>

              <button onClick={handleHitung} disabled={isPending} className="btn-secondary">
                Hitung
              </button>
            </>
          )}

          {hasil && !kodeTersimpan && (
            <div className="result-box space-y-2">
              <RingkasanHasil hasil={hasil} namaPelanggan={namaPelanggan} />
              <button onClick={handleSimpanTransaksi} disabled={isPending} className="btn-primary">
                {isPending ? "Menyimpan..." : "Simpan sebagai transaksi"}
              </button>
            </div>
          )}

          {kodeTersimpan && hasil && (
            <div className="result-success space-y-2">
              <p className="text-sm text-green-800 dark:text-green-300">
                Transaksi tersimpan: <strong>{kodeTersimpan}</strong>
              </p>
              <RingkasanHasil hasil={hasil} namaPelanggan={namaPelanggan} />
              <button onClick={() => window.print()} className="btn-secondary">
                Cetak struk
              </button>
              <button onClick={resetForm} className="btn-primary">
                Tambah transaksi
              </button>
            </div>
          )}
        </>
      )}

      {error && <div className="alert-error">{error}</div>}

      {strukData && <Struk {...strukData} />}
    </div>
  );
}