import { prisma } from "@/lib/db";
import type { UserSesi } from "@/lib/rbac-core";
import { ambilOrtuAsuhIdUser } from "./komitmen";

/** Jadwal bayar milik donatur yang masih bisa diunggahkan bukti transfernya. */
export async function ambilJadwalBayarTerbukaOrtuAsuh(userId: string) {
  const ortuAsuhId = await ambilOrtuAsuhIdUser(userId);
  return prisma.jadwalBayar.findMany({
    where: {
      komitmen: { ortuAsuhId },
      status: { in: ["BELUM_JATUH_TEMPO", "JATUH_TEMPO", "TERLAMBAT"] },
    },
    include: { periode: { select: { kode: true } } },
    orderBy: { jatuhTempo: "asc" },
  });
}

/** Riwayat transaksi milik donatur yang sedang login — untuk /donatur/pembayaran. */
export async function ambilRiwayatTransaksiOrtuAsuh(userId: string) {
  const ortuAsuhId = await ambilOrtuAsuhIdUser(userId);
  return prisma.transaksi.findMany({
    where: { ortuAsuhId },
    include: {
      jadwalBayar: { include: { periode: { select: { kode: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Satu jadwal bayar milik donatur yang sedang login — cek kepemilikan sebelum unggah bukti. */
export async function ambilJadwalBayarMilikOrtuAsuh(jadwalBayarId: string, userId: string) {
  const ortuAsuhId = await ambilOrtuAsuhIdUser(userId);
  const jadwal = await prisma.jadwalBayar.findUnique({
    where: { id: jadwalBayarId },
    include: { komitmen: true },
  });
  if (!jadwal || jadwal.komitmen.ortuAsuhId !== ortuAsuhId) {
    return null;
  }
  return jadwal;
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
 * Titik IDOR yang setara dengan cekAksesBerkas (CLAUDE.md aturan keras #7):
 * hanya ADMIN dan donatur pemilik transaksi yang boleh melihat bukti
 * transfernya.
 */
export async function cekAksesBuktiTransaksi(
  transaksiId: string,
  user: UserSesi,
): Promise<AksesBuktiTransaksi | null> {
  const transaksi = await prisma.transaksi.findUnique({
    where: { id: transaksiId },
    select: {
      id: true,
      buktiObjectKey: true,
      ortuAsuh: { select: { userId: true } },
    },
  });

  if (!transaksi) return null;

  const pemilik = user.role === "ADMIN" || transaksi.ortuAsuh.userId === user.id;
  if (!pemilik) return null;

  return { transaksi: { id: transaksi.id, buktiObjectKey: transaksi.buktiObjectKey } };
}
