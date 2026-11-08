"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { keluar } from "@/app/login/actions";

interface NavbarProps {
  pengguna: { nama: string; role: "SUPER_ADMIN" | "PEMILIK_TOKO" } | null;
}

const MENU_PEMILIK = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/preferensi", label: "Preferensi" },
];

const MENU_SUPER_ADMIN = [{ href: "/dashboard", label: "Dashboard" }];

export default function Navbar({ pengguna }: NavbarProps) {
  const pathname = usePathname();
  if (!pengguna) return null;

  const menu = pengguna.role === "SUPER_ADMIN" ? MENU_SUPER_ADMIN : MENU_PEMILIK;

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <nav className="mx-auto flex max-w-3xl items-center gap-1 px-4 py-2">
        <Link href="/dashboard" className="mr-3 hidden font-semibold sm:block">
          Emas Kita
        </Link>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {menu.map((item) => {
            const aktif = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={aktif ? "page" : undefined}
                className={
                  "shrink-0 rounded px-3 py-1.5 text-sm " +
                  (aktif
                    ? "bg-gray-100 font-medium dark:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <span className="muted hidden text-sm sm:block">{pengguna.nama}</span>
        <ThemeToggle />
        <form action={keluar}>
          <button
            type="submit"
            className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Keluar
          </button>
        </form>
      </nav>
    </header>
  );
}
