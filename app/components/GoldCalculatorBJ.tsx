"use client";

import { useState, useTransition } from "react";
import { hitungKalkulatorBj } from "@/app/kalkulator/actions";
import type { KalkulasiLengkapResult } from "@/lib/gold-bj-calculator";

export default function GoldCalculatorBJ() {
  const [beratKering, setBeratKering] = useState<string>("10");
  const [beratBasah, setBeratBasah] = useState<string>("9.3");
  const [hargaPerGram, setHargaPerGram] = useState<string>("1900000");

  const [hasil, setHasil] = useState<KalkulasiLengkapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const handleHitung = () => {
    setError(null);
    setHasil(null);

    const bk = parseFloat(beratKering);
    const bb = parseFloat(beratBasah);
    const hp = parseFloat(hargaPerGram);

    if (isNaN(bk) || isNaN(bb) || isNaN(hp)) {
      setError("Semua input harus berupa angka");
      return;
    }

    startTransition(async () => {
      const res = await hitungKalkulatorBj({
        beratKering: bk,
        beratBasah: bb,
        hargaPerGram: hp,
      });

      if (res.ok) {
        setHasil(res.data);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="max-w-sm mx-auto p-4 space-y-4">
      <div>
        <label className="block text-sm mb-1">Berat kering (Bk) - gram</label>
        <input
          type="number"
          step={0.01}
          value={beratKering}
          onChange={(e) => setBeratKering(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Berat basah (Bb) - gram</label>
        <input
          type="number"
          step={0.01}
          value={beratBasah}
          onChange={(e) => setBeratBasah(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Harga emas per gram (Hp)</label>
        <input
          type="number"
          step={1000}
          value={hargaPerGram}
          onChange={(e) => setHargaPerGram(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        onClick={handleHitung}
        disabled={isPending}
        className="w-full bg-black text-white rounded py-2 disabled:opacity-50"
      >
        {isPending ? "Menghitung..." : "Hitung"}
      </button>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded p-3">
          {error}
        </div>
      )}

      {hasil && (
        <div className="bg-gray-100 rounded p-4 space-y-2">
          <div>
            <p className="text-sm text-gray-500">Berat jenis (Bj)</p>
            <p className="font-medium">{hasil.bj.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Kadar (Kd)</p>
            <p className="font-medium">{hasil.kadarPersen.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total harga (Th)</p>
            <p className="text-2xl font-semibold">
              {formatRupiah(hasil.totalHarga)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}