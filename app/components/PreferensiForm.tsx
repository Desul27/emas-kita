"use client";

import { useState, useEffect, useTransition } from "react";
import { ambilDaftarToko, ambilHargaTerbaru, type TokoRow } from "@/app/kalkulator/actions";
import {
  ambilPreferensiToko,
  simpanPreferensiToko,
  simpanHargaHariIni,
  ambilAturanKalkulator,
  simpanAturanKalkulator,
} from "@/app/preferensi/actions";
import { ATURAN_DEFAULT, type ModeKalkulator } from "@/lib/aturan-kalkulator";

export default function PreferensiForm() {
  const [daftarToko, setDaftarToko] = useState<TokoRow[]>([]);
  const [tokoId, setTokoId] = useState("");

  const [mataUang, setMataUang] = useState("IDR");
  const [tema, setTema] = useState("light");
  const [bahasa, setBahasa] = useState("id");

  const [hargaHariIni, setHargaHariIni] = useState("");
  const [hargaTerkini, setHargaTerkini] = useState<string | null>(null);

  const [mode, setMode] = useState<ModeKalkulator>("default");
  const [bulatBk, setBulatBk] = useState(ATURAN_DEFAULT.bulatkanBeratKering);
  const [bulatKadar, setBulatKadar] = useState(ATURAN_DEFAULT.bulatkanKadar);
  const [cetak, setCetak] = useState(ATURAN_DEFAULT.cetakStruk);

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const list = await ambilDaftarToko();
      setDaftarToko(list);
      if (list.length > 0) setTokoId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!tokoId) return;
    startTransition(async () => {
      const pref = await ambilPreferensiToko(tokoId);
      if (pref) {
        setMataUang(pref.mataUang);
        setTema(pref.tema);
        setBahasa(pref.bahasa);
      }
      const aturan = await ambilAturanKalkulator(tokoId);
      if (aturan) {
        setMode(aturan.modeKalkulator === "kustom" ? "kustom" : "default");
        setBulatBk(aturan.bulatkanBeratKering);
        setBulatKadar(aturan.bulatkanKadar);
        setCetak(aturan.cetakStruk);
      }
      const harga = await ambilHargaTerbaru(tokoId);
      setHargaTerkini(
        harga
          ? `${new Intl.NumberFormat("id-ID").format(harga.hargaPerGram)} (${new Date(
              harga.tanggal
            ).toLocaleDateString("id-ID")})`
          : "Belum diset"
      );
    });
  }, [tokoId]);

  const handleSimpanPreferensi = () => {
    setStatus(null);
    setError(null);
    startTransition(async () => {
      const res = await simpanPreferensiToko(tokoId, { mataUang, tema, bahasa });
      if (res.ok) setStatus("Preferensi tersimpan.");
      else setError(res.error);
    });
  };

  const handleSimpanAturan = () => {
    setStatus(null);
    setError(null);
    startTransition(async () => {
      const res = await simpanAturanKalkulator(tokoId, {
        modeKalkulator: mode,
        bulatkanBeratKering: bulatBk,
        bulatkanKadar: bulatKadar,
        cetakStruk: cetak,
      });
      if (res.ok) setStatus("Aturan kalkulator tersimpan.");
      else setError(res.error);
    });
  };

  const handleSimpanHarga = () => {
    setStatus(null);
    setError(null);
    const hp = parseFloat(hargaHariIni);
    if (isNaN(hp) || hp <= 0) {
      setError("Harga per gram harus berupa angka lebih dari 0");
      return;
    }
    startTransition(async () => {
      const res = await simpanHargaHariIni({ tokoId, hargaPerGram: hp });
      if (res.ok) {
        setStatus("Harga emas hari ini tersimpan.");
        setHargaHariIni("");
        const harga = await ambilHargaTerbaru(tokoId);
        setHargaTerkini(
          harga
            ? `${new Intl.NumberFormat("id-ID").format(harga.hargaPerGram)} (${new Date(
                harga.tanggal
              ).toLocaleDateString("id-ID")})`
            : null
        );
      } else {
        setError(res.error);
      }
    });
  };

  if (daftarToko.length === 0) {
    return (
      <p className="muted mx-auto max-w-sm p-4">
        Belum ada toko. Buat toko dulu lewat halaman Kalkulator.
      </p>
    );
  }

  // Di mode default, checklist menampilkan aturan standar (tidak bisa diubah)
  const nilaiBk = mode === "default" ? ATURAN_DEFAULT.bulatkanBeratKering : bulatBk;
  const nilaiKadar = mode === "default" ? ATURAN_DEFAULT.bulatkanKadar : bulatKadar;
  const nilaiCetak = mode === "default" ? ATURAN_DEFAULT.cetakStruk : cetak;

  return (
    <div className="mx-auto max-w-sm space-y-6 p-4">
      <div>
        <label className="label">Toko</label>
        <select value={tokoId} onChange={(e) => setTokoId(e.target.value)} className="field">
          {daftarToko.map((t) => (
            <option key={t.id} value={t.id}>{t.nama}</option>
          ))}
        </select>
      </div>

      <section className="card space-y-2">
        <h2 className="font-semibold">Harga emas harian</h2>
        <p className="muted">Harga saat ini: {hargaTerkini}</p>
        <label className="label">Set harga emas 24K per gram (hari ini)</label>
        <input
          type="number"
          step={1000}
          value={hargaHariIni}
          onChange={(e) => setHargaHariIni(e.target.value)}
          className="field"
          placeholder="Contoh: 1900000"
        />
        <button onClick={handleSimpanHarga} disabled={isPending} className="btn-primary">
          Simpan harga hari ini
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Aturan kalkulator</h2>

        <fieldset className="space-y-2">
          <legend className="label">Mode</legend>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="modeKalkulator"
              checked={mode === "default"}
              onChange={() => setMode("default")}
              className="mt-1"
            />
            <span><strong>Default</strong> — semua aturan standar toko aktif</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="modeKalkulator"
              checked={mode === "kustom"}
              onChange={() => setMode("kustom")}
              className="mt-1"
            />
            <span><strong>Kustom</strong> — pilih aturan satu per satu</span>
          </label>
        </fieldset>

        <fieldset
          disabled={mode === "default"}
          className={"space-y-2 " + (mode === "default" ? "opacity-60" : "")}
        >
          <legend className="label">Aturan</legend>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={nilaiBk}
              onChange={(e) => setBulatBk(e.target.checked)}
              className="mt-1"
            />
            <span>Bulatkan berat kering ke bawah (1 desimal)</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={nilaiKadar}
              onChange={(e) => setBulatKadar(e.target.checked)}
              className="mt-1"
            />
            <span>Bulatkan kadar ke bawah jika kadar 10% atau kurang</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={nilaiCetak}
              onChange={(e) => setCetak(e.target.checked)}
              className="mt-1"
            />
            <span>Cetak struk otomatis saat simpan transaksi</span>
          </label>
        </fieldset>

        <button onClick={handleSimpanAturan} disabled={isPending} className="btn-primary">
          Simpan aturan kalkulator
        </button>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">Preferensi umum</h2>

        <div>
          <label className="label">Mata uang</label>
          <select value={mataUang} onChange={(e) => setMataUang(e.target.value)} className="field">
            <option value="IDR">IDR - Rupiah</option>
            <option value="USD">USD - Dolar AS</option>
          </select>
        </div>

        <div>
          <label className="label">Tema</label>
          <select value={tema} onChange={(e) => setTema(e.target.value)} className="field">
            <option value="light">Terang</option>
            <option value="dark">Gelap (belum diterapkan di UI)</option>
          </select>
        </div>

        <div>
          <label className="label">Bahasa</label>
          <select value={bahasa} onChange={(e) => setBahasa(e.target.value)} className="field">
            <option value="id">Indonesia</option>
            <option value="en">English (belum diterapkan di UI)</option>
          </select>
        </div>

        <button onClick={handleSimpanPreferensi} disabled={isPending} className="btn-primary">
          Simpan preferensi
        </button>
      </section>

      {status && <div className="alert-success">{status}</div>}
      {error && <div className="alert-error">{error}</div>}
    </div>
  );
}