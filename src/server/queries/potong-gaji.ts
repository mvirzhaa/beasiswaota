import { prisma } from "@/lib/db";

function rentangBulanBerjalan() {
  const sekarang = new Date();
  const awal = new Date(Date.UTC(sekarang.getUTCFullYear(), sekarang.getUTCMonth(), 1));
  const akhir = new Date(Date.UTC(sekarang.getUTCFullYear(), sekarang.getUTCMonth() + 1, 1));
  return { awal, akhir };
}

/** Daftar potongan bulan berjalan untuk diekspor ke payroll. */
export async function ambilDaftarPotonganBulanBerjalan() {
  const { awal, akhir } = rentangBulanBerjalan();
  return prisma.jadwalBayar.findMany({
    where: {
      jatuhTempo: { gte: awal, lt: akhir },
      status: { in: ["BELUM_JATUH_TEMPO", "JATUH_TEMPO"] },
      komitmen: { mekanisme: "POTONG_GAJI" },
    },
    include: {
      periode: { select: { kode: true } },
      komitmen: {
        select: { ortuAsuh: { select: { nip: true, nama: true, atasNamaMunfiq: true } } },
      },
    },
    orderBy: { jatuhTempo: "asc" },
  });
}

/** Satu jadwal bayar + NIP donatur pemilik komitmennya, untuk validasi impor realisasi. */
export async function ambilJadwalBayarUntukPotonganGaji(jadwalBayarId: string) {
  return prisma.jadwalBayar.findUnique({
    where: { id: jadwalBayarId },
    include: {
      komitmen: {
        select: {
          id: true,
          ortuAsuhId: true,
          mekanisme: true,
          ortuAsuh: { select: { nip: true, nama: true } },
        },
      },
    },
  });
}
