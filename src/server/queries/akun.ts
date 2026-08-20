import { prisma } from "@/lib/db";

/** Akun MAHASISWA/ORTU_ASUH hasil pendaftaran mandiri yang belum diverifikasi admin. */
export async function ambilAkunMenungguVerifikasi() {
  return prisma.user.findMany({
    where: { status: "MENUNGGU_VERIFIKASI" },
    include: {
      mahasiswa: { select: { nama: true, nim: true } },
      ortuAsuh: { select: { nama: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
