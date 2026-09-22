import { prisma } from "@/lib/db";
import type { UserSesi } from "@/lib/rbac-core";

export interface AksesBerkas {
  berkas: {
    id: string;
    objectKey: string;
    namaAsli: string;
    mimeType: string;
  };
}

/**
 * Titik IDOR paling rawan (lihat CLAUDE.md aturan keras #7). Mahasiswa
 * tidak punya akun/login — satu-satunya sesi yang mungkin ada di sistem
 * ini adalah ADMIN.
 */
export async function cekAksesBerkas(
  berkasId: string,
  user: UserSesi,
): Promise<AksesBerkas | null> {
  if (user.role !== "ADMIN") return null;

  const berkas = await prisma.pengajuanBerkas.findUnique({
    where: { id: berkasId },
    select: { id: true, objectKey: true, namaAsli: true, mimeType: true },
  });
  if (!berkas) return null;

  return {
    berkas: {
      id: berkas.id,
      objectKey: berkas.objectKey,
      namaAsli: berkas.namaAsli,
      mimeType: berkas.mimeType,
    },
  };
}
