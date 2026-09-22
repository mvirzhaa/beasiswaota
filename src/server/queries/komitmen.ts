import { prisma } from "@/lib/db";

/** Jumlah komitmen donatur yang masih perlu dikonfirmasi admin — dipakai badge sidebar. */
export async function ambilJumlahKomitmenMenunggu(): Promise<number> {
  return prisma.komitmen.count({ where: { status: "MENUNGGU_KONFIRMASI" } });
}

/** Periode yang masih boleh dipilih donatur — periode SELESAI terkunci, tidak boleh ada mutasi baru. */
export async function ambilPeriodeUntukKomitmen() {
  return prisma.periode.findMany({
    where: { status: { not: "SELESAI" } },
    orderBy: { tglBuka: "asc" },
  });
}

/** Komitmen milik donatur — dipakai halaman publik /laporan/{kodeAkses}. */
export async function ambilKomitmenOrtuAsuh(ortuAsuhId: string) {
  return prisma.komitmen.findMany({
    where: { ortuAsuhId },
    orderBy: { createdAt: "desc" },
  });
}

/** Jadwal bayar milik donatur — dipakai halaman publik /laporan/{kodeAkses}. */
export async function ambilJadwalBayarOrtuAsuh(ortuAsuhId: string) {
  return prisma.jadwalBayar.findMany({
    where: { komitmen: { ortuAsuhId } },
    include: {
      periode: { select: { kode: true } },
      komitmen: { select: { skema: true, mekanisme: true } },
    },
    orderBy: { jatuhTempo: "asc" },
  });
}

/** Daftar komitmen untuk panel admin, dengan filter status opsional. */
export async function ambilDaftarKomitmenAdmin(filter: {
  status?:
    | "MENUNGGU_KONFIRMASI"
    | "AKTIF"
    | "MENUNGGAK"
    | "SELESAI"
    | "DIBATALKAN";
}) {
  return prisma.komitmen.findMany({
    where: filter.status ? { status: filter.status } : {},
    include: {
      ortuAsuh: { select: { nama: true, tipe: true, atasNamaMunfiq: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
