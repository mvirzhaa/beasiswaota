import type { Role } from "@prisma/client";

export interface UserSesi {
  id: string;
  role: Role;
}

/**
 * Lapis ketiga RBAC (aturan keras #5) — dipanggil di DALAM action/query,
 * bukan cuma di layout. Meloloskan ADMIN, menolak user lain yang bukan
 * pemilik data. Ini penjaga terakhir dari IDOR.
 *
 * Sengaja dipisah dari rbac.ts (yang mengimpor next-auth) supaya modul ini
 * bebas dependensi runtime Next.js dan bisa ditest langsung di Vitest/Node.
 */
export function assertPemilik(pemilikId: string, user: UserSesi): void {
  if (user.role === "ADMIN") return;
  if (user.id !== pemilikId) {
    throw new Error("Anda tidak memiliki akses ke data ini");
  }
}
