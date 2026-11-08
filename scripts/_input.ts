// scripts/_input.ts
// Pembantu input terminal: antrean baris (jawaban yang masuk sekaligus tidak
// hilang) dan mode tersembunyi untuk PIN/kata sandi.

import { createInterface } from "node:readline";
import { Writable } from "node:stream";

let tersembunyi = false;
const keluaran = new Writable({
  write(chunk, _enc, cb) {
    if (!tersembunyi) process.stdout.write(chunk);
    cb();
  },
});

const rl = createInterface({
  input: process.stdin,
  output: keluaran,
  terminal: Boolean(process.stdin.isTTY),
});

const antrean: string[] = [];
const menunggu: Array<{ ok: (s: string) => void; gagal: (e: Error) => void }> = [];
let selesai = false;

rl.on("line", (baris) => {
  const w = menunggu.shift();
  if (w) w.ok(baris);
  else antrean.push(baris);
});
rl.on("close", () => {
  selesai = true;
  while (menunggu.length) menunggu.shift()!.gagal(new Error("Input terhenti sebelum semua pertanyaan terjawab."));
});

function ambilBaris(): Promise<string> {
  if (antrean.length) return Promise.resolve(antrean.shift()!);
  if (selesai) return Promise.reject(new Error("Input terhenti sebelum semua pertanyaan terjawab."));
  return new Promise((ok, gagal) => menunggu.push({ ok, gagal }));
}

export async function tanya(pertanyaan: string): Promise<string> {
  process.stdout.write(pertanyaan);
  const jawaban = await ambilBaris();
  if (!process.stdin.isTTY) process.stdout.write(jawaban + "\n");
  return jawaban;
}

export async function tanyaRahasia(pertanyaan: string): Promise<string> {
  process.stdout.write(pertanyaan);
  tersembunyi = true;
  try {
    return await ambilBaris();
  } finally {
    tersembunyi = false;
    process.stdout.write("\n");
  }
}

export function tutupInput(): void {
  rl.close();
}
