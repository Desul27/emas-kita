"use client";

import { useActionState, useSyncExternalStore } from "react";
import { masuk, type LoginState } from "./actions";

// Detik berjalan sebagai "external store": React menangani langganan dan
// pembersihannya, tanpa setState di dalam useEffect.
function berlangganan(panggil: () => void) {
  const timer = setInterval(panggil, 1000);
  return () => clearInterval(timer);
}
const detikSekarang = () => Math.floor(Date.now() / 1000) * 1000;
const detikServer = () => 0;

type StateForm = LoginState & { diterimaMs?: number };
const AWAL: StateForm = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (sebelumnya: StateForm, formData: FormData): Promise<StateForm> => {
      const hasil = await masuk(sebelumnya, formData);
      // Waktu diterima dicatat di sini (callback async), bukan saat render.
      return { ...hasil, diterimaMs: Date.now() };
    },
    AWAL
  );

  const sekarang = useSyncExternalStore(berlangganan, detikSekarang, detikServer);

  const berakhirMs =
    state.sisaDetik && state.diterimaMs
      ? state.diterimaMs + state.sisaDetik * 1000
      : 0;
  const hitungMundur = berakhirMs
    ? Math.max(0, Math.ceil((berakhirMs - sekarang) / 1000))
    : 0;
  const dijeda = hitungMundur > 0;

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="identitas" className="mb-1 block text-sm">
          Username atau email
        </label>
        <input
          id="identitas"
          name="identitas"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div>
        <label htmlFor="rahasia" className="mb-1 block text-sm">
          PIN / kata sandi
        </label>
        <input
          id="rahasia"
          name="rahasia"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {dijeda
            ? `Terlalu banyak percobaan gagal. Coba lagi dalam ${hitungMundur} detik.`
            : state.sisaDetik
              ? "Silakan coba lagi."
              : state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || dijeda}
        className="w-full rounded bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {pending ? "Memeriksa..." : dijeda ? `Tunggu ${hitungMundur} detik` : "Masuk"}
      </button>
    </form>
  );
}
