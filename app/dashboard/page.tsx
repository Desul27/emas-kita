import { wajibLogin } from "@/lib/auth/guard";

export default async function DashboardPage() {
  const pengguna = await wajibLogin();
  return (
    <main className="min-h-screen py-10">
      <h1 className="mb-2 text-center text-xl font-semibold">Dashboard</h1>
      <p className="muted text-center">
        Halo, {pengguna.nama}.{" "}
        {pengguna.role === "SUPER_ADMIN"
          ? "Pengelolaan akun Pemilik Toko akan tersedia di sini."
          : "Ringkasan transaksi dan stok akan tampil di sini."}
      </p>
    </main>
  );
}
