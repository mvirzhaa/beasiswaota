import { prisma } from "@/lib/db";

/** Jadwal bayar mekanisme TRANSFER_MANUAL yang belum lunas, untuk dropdown pencatatan admin. */
export async function ambilDaftarJadwalTransferManualBelumLunas() {
  return prisma.jadwalBayar.findMany({
    where: {
      status: { in: ["BELUM_JATUH_TEMPO", "JATUH_TEMPO", "TERLAMBAT"] },
      komitmen: { mekanisme: "TRANSFER_MANUAL" },
    },
    include: {
      periode: { select: { kode: true } },
      komitmen: {
        select: { ortuAsuh: { select: { nama: true, atasNamaMunfiq: true } } },
      },
    },
    orderBy: { jatuhTempo: "asc" },
  });
}

/** Satu jadwal bayar + mekanisme komitmennya, untuk validasi pencatatan transfer manual. */
export async function ambilJadwalBayarUntukTransferManual(jadwalBayarId: string) {
  return prisma.jadwalBayar.findUnique({
    where: { id: jadwalBayarId },
    include: {
      komitmen: {
        select: {
          id: true,
          ortuAsuhId: true,
          mekanisme: true,
          ortuAsuh: { select: { nama: true } },
        },
      },
    },
  });
}
