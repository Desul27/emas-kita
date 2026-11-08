import GoldCalculatorBJ from "../components/GoldCalculatorBJ";
import { wajibPemilikHalaman } from "@/lib/auth/guard";

export default async function KalkulatorPage() {
  await wajibPemilikHalaman();
  return (
    <main className="min-h-screen py-10">
      <h1 className="text-xl font-semibold text-center mb-2">
        Kalkulator harga emas
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Metode berat jenis (Bk, Bb, Hp)
      </p>
      <GoldCalculatorBJ />
    </main>
  );
}
