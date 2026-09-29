"use server";

import { prisma } from "@/lib/prisma";
import type { AturanTersimpan } from "@/lib/aturan-kalkulator";

export interface PreferensiToko {
  mataUang: string;
  tema: string;
  bahasa: string;
}

export async function ambilPreferensiToko(
  tokoId: string
): Promise<PreferensiToko | null> {
  const toko = await prisma.toko.findUnique({
    where: { id: tokoId },
    select: { mataUang: true, tema: true, bahasa: true },
  });
  return toko;
}

export async function simpanPreferensiToko(
  tokoId: string,
  data: PreferensiToko
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.toko.update({
      where: { id: tokoId },
      data: {
        mataUang: data.mataUang,
        tema: data.tema,
        bahasa: data.bahasa,
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { ok: false, error: message };
  }
}

export interface SimpanHargaInput {
  tokoId: string;
  hargaPerGram: number;
}

export async function simpanHargaHariIni(
  input: SimpanHargaInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (input.hargaPerGram <= 0) {
      return { ok: false, error: "Harga per gram harus lebih besar dari 0" };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.hargaEmasHarian.upsert({
      where: { tokoId_tanggal: { tokoId: input.tokoId, tanggal: today } },
      update: { hargaPerGram: input.hargaPerGram },
      create: {
        tokoId: input.tokoId,
        tanggal: today,
        hargaPerGram: input.hargaPerGram,
      },
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { ok: false, error: message };
  }
}

// ============ ATURAN KALKULATOR ============

export async function ambilAturanKalkulator(
  tokoId: string
): Promise<AturanTersimpan | null> {
  return prisma.toko.findUnique({
    where: { id: tokoId },
    select: {
      modeKalkulator: true,
      bulatkanBeratKering: true,
      bulatkanKadar: true,
      cetakStruk: true,
    },
  });
}

export async function simpanAturanKalkulator(
  tokoId: string,
  data: AturanTersimpan
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (data.modeKalkulator !== "default" && data.modeKalkulator !== "kustom") {
      return { ok: false, error: "Mode kalkulator tidak dikenal" };
    }
    await prisma.toko.update({
      where: { id: tokoId },
      data: {
        modeKalkulator: data.modeKalkulator,
        bulatkanBeratKering: data.bulatkanBeratKering,
        bulatkanKadar: data.bulatkanKadar,
        cetakStruk: data.cetakStruk,
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { ok: false, error: message };
  }
}