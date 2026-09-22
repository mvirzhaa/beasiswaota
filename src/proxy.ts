import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { tentukanAksesRute } from "@/lib/rbac-routing";

// Instance NextAuth terpisah dari src/lib/auth.ts — hanya pakai authConfig
// (tanpa provider Credentials yang butuh Prisma/argon2), supaya proxy tidak
// perlu memuat Prisma client di tiap request. Lihat catatan di
// src/lib/auth.config.ts.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const sesi = req.auth?.user ? { role: req.auth.user.role } : null;

  const keputusan = tentukanAksesRute(pathname, sesi);

  if (keputusan === "LOGIN") {
    // matcher di bawah cuma /admin/:path*, jadi keputusan LOGIN di sini
    // selalu untuk rute admin — arahkan ke path rahasia admin (lihat
    // ADMIN_LOGIN_PATH di src/lib/env.ts), bukan /login publik. Baca
    // langsung dari process.env (bukan import env.ts) supaya file edge
    // ini tidak ikut memvalidasi seluruh env schema Node-only.
    const pathLoginAdmin = process.env.ADMIN_LOGIN_PATH || "login";
    const url = new URL(`/${pathLoginAdmin}`, req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (keputusan === "FORBIDDEN") {
    return NextResponse.redirect(new URL("/403", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
