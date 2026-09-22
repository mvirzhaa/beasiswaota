import type { Role } from "@prisma/client";

// Peta route group -> role yang diizinkan. Dipakai src/proxy.ts (middleware
// Edge Next.js 16). Hanya /admin karena mahasiswa/donatur tidak punya akun.
export const PETA_ROLE_ROUTE: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin", role: "ADMIN" },
];

export type KeputusanAkses = "IZINKAN" | "LOGIN" | "FORBIDDEN";

/**
 * Fungsi murni yang jadi inti logika middleware — dipisah dari middleware.ts
 * (yang jalan di Edge Runtime dan butuh objek NextRequest) supaya bisa
 * ditest langsung tanpa environment Edge.
 */
export function tentukanAksesRute(
  pathname: string,
  sesi: { role: Role } | null,
): KeputusanAkses {
  const aturan = PETA_ROLE_ROUTE.find((r) => pathname.startsWith(r.prefix));
  if (!aturan) return "IZINKAN";
  if (!sesi) return "LOGIN";
  if (sesi.role !== aturan.role) return "FORBIDDEN";
  return "IZINKAN";
}
