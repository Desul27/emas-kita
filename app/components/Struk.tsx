// Struk transaksi. Tersembunyi di layar, hanya tampil saat dicetak
// (lihat aturan @media print di globals.css).

export interface StrukProps {
  namaToko: string;
  kodeTransaksi: string;
  tanggal: string; // ISO
  namaPelanggan?: string;
  beratKering: number;
  kadarPersen: number;
  hargaPerGram: number;
  totalHarga: number;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className="text-right">{nilai}</span>
    </div>
  );
}

export default function Struk(p: StrukProps) {
  return (
    <div className="struk hidden print:block font-mono text-xs leading-relaxed">
      <div className="text-center font-bold">{p.namaToko}</div>
      <div className="text-center">Struk pembelian emas</div>
      <hr className="my-2 border-dashed" />

      <Baris label="No" nilai={p.kodeTransaksi} />
      <Baris label="Tanggal" nilai={new Date(p.tanggal).toLocaleString("id-ID")} />
      {p.namaPelanggan && <Baris label="Pelanggan" nilai={p.namaPelanggan} />}
      <hr className="my-2 border-dashed" />

      <Baris label="Berat kering" nilai={`${p.beratKering} g`} />
      <Baris label="Kadar" nilai={`${p.kadarPersen.toFixed(2)}%`} />
      <Baris label="Harga/gram" nilai={rupiah(p.hargaPerGram)} />
      <hr className="my-2 border-dashed" />

      <div className="flex justify-between gap-2 text-sm font-bold">
        <span>TOTAL</span>
        <span>{rupiah(p.totalHarga)}</span>
      </div>
      <hr className="my-2 border-dashed" />
      <div className="text-center">Terima kasih</div>
    </div>
  );
}
