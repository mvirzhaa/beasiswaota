import { prisma } from "@/lib/db";
import type { UserSesi } from "@/lib/rbac-core";

/** Jumlah transaksi menunggu verifikasi — dipakai badge sidebar. */
export async function ambilJumlahTransaksiMenunggu(): Promise<number> {
  return prisma.transaksi.count({ where: { status: "MENUNGGU_VERIFIKASI" } });
}

/** Daftar transaksi untuk panel admin, dengan filter status opsional. */
export async function ambilDaftarTransaksiAdmin(filter: {
  status?: "MENUNGGU_VERIFIKASI" | "TERVERIFIKASI" | "DITOLAK" | "DIKEMBALIKAN";
}) {
  return prisma.transaksi.findMany({
    where: filter.status ? { status: filter.status } : {},
    include: {
      ortuAsuh: { select: { nama: true, atasNamaMunfiq: true } },
      jadwalBayar: { include: { periode: { select: { kode: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function ambilTransaksiDetailAdmin(id: string) {
  return prisma.transaksi.findUnique({
    where: { id },
    include: {
      ortuAsuh: true,
      komitmen: true,
      jadwalBayar: { include: { periode: true } },
    },
  });
}

export interface AksesBuktiTransaksi {
  transaksi: { id: string; buktiObjectKey: string | null };
}

/**
 * Titik IDOR yang setara dengan cekAksesBerkas (CLAUDE.md aturan keras #7).
 * Donatur tidak punya akun/login — satu-satunya yang pernah punya sesi di
 * sistem ini adalah ADMIN, jadi cukup cek role di sini.
 */
export async function cekAksesBuktiTransaksi(
  transaksiId: string,
  user: UserSesi,
): Promise<AksesBuktiTransaksi | null> {
  if (user.role !== "ADMIN") return null;

  const transaksi = await prisma.transaksi.findUnique({
    where: { id: transaksiId },
    select: { id: true, buktiObjectKey: true },
  });
  if (!transaksi) return null;

  return { transaksi: { id: transaksi.id, buktiObjectKey: transaksi.buktiObjectKey } };
}
