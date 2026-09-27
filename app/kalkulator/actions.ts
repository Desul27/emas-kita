"use server";

import { prisma } from "@/lib/prisma";
import {
  kalkulasiLengkap,
  type KalkulasiLengkapResult,
} from "@/lib/gold-bj-calculator";

// ============ TOKO ============

export interface TokoRow {
  id: string;
  nama: string;
}

export async function ambilDaftarToko(): Promise<TokoRow[]> {
  return prisma.toko.findMany({
    select: { id: true, nama: true },
    orderBy: { nama: "asc" },
  });
}

export async function buatToko(nama: string): Promise<TokoRow> {
  if (!nama.trim()) {
    throw new Error("Nama toko tidak boleh kosong");
  }
  return prisma.toko.create({
    data: { nama: nama.trim() },
    select: { id: true, nama: true },
  });
}

// ============ HARGA EMAS HARIAN (dikelola dari halaman Preferensi) ============

export interface HargaTerbaru {
  hargaPerGram: number;
  tanggal: Date;
}

export async function ambilHargaTerbaru(
  tokoId: string
): Promise<HargaTerbaru | null> {
  const row = await prisma.hargaEmasHarian.findFirst({
    where: { tokoId },
    orderBy: { tanggal: "desc" },
  });
  if (!row) return null;
  return { hargaPerGram: row.hargaPerGram, tanggal: row.tanggal };
}

// ============ KALKULASI (tanpa simpan) ============

export interface HitungInput {
  tokoId: string;
  beratKering: number;
  beratBasah: number;
}

export type HitungResult =
  | { ok: true; data: KalkulasiLengkapResult }
  | { ok: false; error: string };

export async function hitungKalkulatorBj(
  input: HitungInput
): Promise<HitungResult> {
  try {
    const harga = await ambilHargaTerbaru(input.tokoId);
    if (!harga) {
      return {
        ok: false,
        error:
          "Harga emas hari ini belum diset. Silakan set dulu di halaman Preferensi.",
      };
    }

    const referensi = await prisma.referensiKadar.findMany({
      select: { bj: true, kadarPersen: true },
    });
    if (referensi.length === 0) {
      return { ok: false, error: "Tabel referensi kadar belum ada isinya." };
    }

    const hasil = kalkulasiLengkap({
      beratKering: input.beratKering,
      beratBasah: input.beratBasah,
      hargaEmasHarian: harga.hargaPerGram,
      referensi,
    });

    return { ok: true, data: hasil };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { ok: false, error: message };
  }
}

// ============ GENERATE KODE TRANSAKSI ============

function formatTanggalKode(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function generateKodeTransaksi(
  tokoId: string,
  tanggal: Date
): Promise<string> {
  const awalHari = new Date(tanggal);
  awalHari.setHours(0, 0, 0, 0);
  const akhirHari = new Date(awalHari);
  akhirHari.setDate(akhirHari.getDate() + 1);

  const jumlahHariIni = await prisma.transaksi.count({
    where: { tokoId, tanggal: { gte: awalHari, lt: akhirHari } },
  });

  const urutan = String(jumlahHariIni + 1).padStart(3, "0");
  return `TRX-${formatTanggalKode(tanggal)}-${urutan}`;
}

// ============ SIMPAN TRANSAKSI ============

export interface SimpanTransaksiInput {
  tokoId: string;
  beratKering: number;
  beratBasah: number;
  namaPelanggan?: string;
}

export type SimpanTransaksiResult =
  | { ok: true; kodeTransaksi: string; data: KalkulasiLengkapResult }
  | { ok: false; error: string };

export async function simpanTransaksi(
  input: SimpanTransaksiInput
): Promise<SimpanTransaksiResult> {
  try {
    const harga = await ambilHargaTerbaru(input.tokoId);
    if (!harga) {
      return {
        ok: false,
        error:
          "Harga emas hari ini belum diset. Silakan set dulu di halaman Preferensi.",
      };
    }

    const referensi = await prisma.referensiKadar.findMany({
      select: { bj: true, kadarPersen: true },
    });
    if (referensi.length === 0) {
      return { ok: false, error: "Tabel referensi kadar belum ada isinya." };
    }

    const hasil = kalkulasiLengkap({
      beratKering: input.beratKering,
      beratBasah: input.beratBasah,
      hargaEmasHarian: harga.hargaPerGram,
      referensi,
    });

    const sekarang = new Date();
    const kodeTransaksi = await generateKodeTransaksi(input.tokoId, sekarang);

    await prisma.transaksi.create({
      data: {
        kodeTransaksi,
        tanggal: sekarang,
        beratKering: input.beratKering,
        beratBasah: input.beratBasah,
        bj: hasil.bj,
        kadarPersen: hasil.kadarPersen,
        hargaPerGram: hasil.hargaPerGramEfektif,
        totalHarga: hasil.totalHarga,
        namaPelanggan: input.namaPelanggan?.trim() || null,
        tokoId: input.tokoId,
      },
    });

    return { ok: true, kodeTransaksi, data: hasil };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return { ok: false, error: message };
  }
}

// ============ STOK HARI INI ============

export interface StokHariIni {
  totalGram: number;
  jumlahTransaksi: number;
}

export async function ambilStokHariIni(tokoId: string): Promise<StokHariIni> {
  const awalHari = new Date();
  awalHari.setHours(0, 0, 0, 0);
  const akhirHari = new Date(awalHari);
  akhirHari.setDate(akhirHari.getDate() + 1);

  const agregat = await prisma.transaksi.aggregate({
    where: { tokoId, tanggal: { gte: awalHari, lt: akhirHari } },
    _sum: { beratKering: true },
    _count: true,
  });

  return {
    totalGram: agregat._sum.beratKering ?? 0,
    jumlahTransaksi: agregat._count,
  };
}