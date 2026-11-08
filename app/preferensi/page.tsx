import PreferensiForm from "../components/PreferensiForm";
import { wajibPemilikHalaman } from "@/lib/auth/guard";

export default async function PreferensiPage() {
  await wajibPemilikHalaman();
  return (
    <main className="min-h-screen py-10">
      <h1 className="text-xl font-semibold text-center mb-6">Preferensi</h1>
      <PreferensiForm />
    </main>
  );
}
