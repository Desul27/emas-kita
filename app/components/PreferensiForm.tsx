"use client";

import { useState, useEffect, useTransition } from "react";
import { ambilDaftarToko, ambilHargaTerbaru, type TokoRow } from "@/app/kalkulator/actions";
import {
  ambilPreferensiToko,
  simpanPreferensiToko,
  simpanHargaHariIni,
} from "@/app/preferensi/actions";

export default function PreferensiForm() {
  const [daftarToko, setDaftarToko] = useState<TokoRow[]>([]);
  const [tokoId, setTokoId] = useState("");

  const [mataUang, setMataUang] = useState("IDR");
  const [tema, setTema] = useState("light");
  const [bahasa, setBahasa] = useState("id");

  const [hargaHariIni, setHargaHariIni] = useState("");
  const [hargaTerkini, setHargaTerkini] = useState<string | null>(null);

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
      <p className="text-sm text-gray-600 max-w-sm mx-auto p-4">
        Belum ada toko. Buat toko dulu lewat halaman Kalkulator.
      </p>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-4 space-y-6 text-gray-900">
      <div>
        <label className="block text-sm mb-1 text-gray-700">Toko</label>
        <select
          value={tokoId}
          onChange={(e) => setTokoId(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white text-gray-900"
        >
          {daftarToko.map((t) => (
            <option key={t.id} value={t.id}>{t.nama}</option>
          ))}
        </select>
      </div>

      <section className="space-y-2 border rounded p-4">
        <h2 className="font-semibold text-gray-900">Harga emas harian</h2>
        <p className="text-sm text-gray-600">Harga saat ini: {hargaTerkini}</p>
        <label className="block text-sm mb-1 text-gray-700">
          Set harga emas 24K per gram (hari ini)
        </label>
        <input
          type="number"
          step={1000}
          value={hargaHariIni}
          onChange={(e) => setHargaHariIni(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white text-gray-900"
          placeholder="Contoh: 1900000"
        />
        <button
          onClick={handleSimpanHarga}
          disabled={isPending}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          Simpan harga hari ini
        </button>
      </section>

      <section className="space-y-2 border rounded p-4">
        <h2 className="font-semibold text-gray-900">Preferensi umum</h2>

        <div>
          <label className="block text-sm mb-1 text-gray-700">Mata uang</label>
          <select
            value={mataUang}
            onChange={(e) => setMataUang(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900"
          >
            <option value="IDR">IDR - Rupiah</option>
            <option value="USD">USD - Dolar AS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700">Tema</label>
          <select
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900"
          >
            <option value="light">Terang</option>
            <option value="dark">Gelap (belum diterapkan di UI)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700">Bahasa</label>
          <select
            value={bahasa}
            onChange={(e) => setBahasa(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white text-gray-900"
          >
            <option value="id">Indonesia</option>
            <option value="en">English (belum diterapkan di UI)</option>
          </select>
        </div>

        <button
          onClick={handleSimpanPreferensi}
          disabled={isPending}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
        >
          Simpan preferensi
        </button>
      </section>

      {status && <div className="bg-green-50 text-green-800 text-sm rounded p-3">{status}</div>}
      {error && <div className="bg-red-50 text-red-800 text-sm rounded p-3">{error}</div>}
    </div>
  );
}