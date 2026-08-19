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
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (keputusan === "FORBIDDEN") {
    return NextResponse.redirect(new URL("/403", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/mahasiswa/:path*", "/donatur/:path*", "/admin/:path*"],
};
