"use server";

import { prisma } from "@/lib/prisma";
import {
  kalkulasiLengkap,
  type KalkulasiLengkapResult,
} from "@/lib/gold-bj-calculator";

export interface HitungKalkulatorInput {
  beratKering: number;
  beratBasah: number;
  hargaPerGram: number;
}

export type HitungKalkulatorResult =
  | { ok: true; data: KalkulasiLengkapResult }
  | { ok: false; error: string };

export async function hitungKalkulatorBj(
  input: HitungKalkulatorInput
): Promise<HitungKalkulatorResult> {
  try {
    const referensi = await prisma.referensiKadar.findMany({
      select: { bj: true, kadarPersen: true },
    });

    if (referensi.length === 0) {
      return {
        ok: false,
        error:
          "Tabel referensi kadar belum ada isinya di database. Import data dulu.",
      };
    }

    const hasil = kalkulasiLengkap({
      beratKering: input.beratKering,
      beratBasah: input.beratBasah,
      hargaPerGram: input.hargaPerGram,
      referensi,
    });

    return { ok: true, data: hasil };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { ok: false, error: message };
  }
}