// proxy.ts (Next.js 16; dulu bernama middleware.ts)
// Pemeriksaan AWAL saja: ada cookie sesi atau tidak. Keabsahan sesi dan
// peran diperiksa di guard pada setiap halaman dan server action.

import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const adaSesi = request.cookies.has("sesi");
  const { pathname } = request.nextUrl;

  // /login selalu lolos: cookie bisa saja kedaluwarsa di database, jadi
  // halaman login sendiri yang mengalihkan kalau sesinya benar-benar valid.
  if (pathname === "/login") return NextResponse.next();

  if (!adaSesi) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
