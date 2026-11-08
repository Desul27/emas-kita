import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/auth/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  if (await ambilPengguna()) redirect("/dashboard");

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold">Emas Kita</h1>
      <p className="muted mb-6 text-sm">Masuk untuk melanjutkan</p>
      <LoginForm />
    </main>
  );
}
