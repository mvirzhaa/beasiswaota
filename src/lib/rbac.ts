import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "./auth";
import { env } from "./env";
import type { UserSesi } from "./rbac-core";

export type { UserSesi } from "./rbac-core";

/**
 * Dipanggil di layout.tsx tiap route group (lapis kedua RBAC). Redirect ke
 * /login (mahasiswa/donatur) atau path rahasia admin kalau belum login,
 * /403 kalau login tapi rolenya tidak diizinkan.
 */
export async function requireRole(...roles: Role[]): Promise<UserSesi> {
  const session = await auth();
  if (!session?.user) {
    const halamanLogin = roles.includes("ADMIN") ? `/${env.ADMIN_LOGIN_PATH}` : "/login";
    redirect(halamanLogin);
  }
  if (!roles.includes(session.user.role)) redirect("/403");
  return { id: session.user.id, role: session.user.role };
}
