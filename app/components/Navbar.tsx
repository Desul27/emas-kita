"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";


const MENU = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/kalkulator", label: "Kalkulator" },
  { href: "/preferensi", label: "Preferensi" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <nav className="mx-auto flex max-w-3xl items-center gap-1 px-4 py-2">
        <Link href="/dashboard" className="mr-3 hidden font-semibold sm:block">
          Emas Kita
        </Link>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {MENU.map((item) => {
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

        <ThemeToggle />
      </nav>
    </header>
  );
}
