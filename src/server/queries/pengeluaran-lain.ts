import { prisma } from "@/lib/db";

/**
 * Periode yang boleh dicatat pengeluaran di luar sistem — beda dari
 * ambilPeriodeUntukAlokasi() (khusus SELEKSI/PENYALURAN untuk mesin
 * alokasi). Dana donatur sudah bisa mengalir sejak PENDAFTARAN, jadi biaya
 * operasional pun bisa muncul sejak periode dibuka; satu-satunya yang
 * dikunci adalah SELESAI (lihat guard di actions.ts).
 */
export async function ambilPeriodeUntukPengeluaranLain() {
  return prisma.periode.findMany({
    where: { status: { not: "SELESAI" } },
    orderBy: { tglBuka: "desc" },
  });
}

export interface BarisPengeluaranLain {
  id: string;
  nominal: bigint;
  keterangan: string;
  createdAt: Date;
  periodeKode: string;
  dicatatOleh: string;
}

/** Riwayat pengeluaran di luar sistem terbaru, lintas periode, untuk halaman admin. */
export async function ambilPengeluaranLainTerbaru(limit = 20): Promise<BarisPengeluaranLain[]> {
  const baris = await prisma.pengeluaranLain.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      periode: { select: { kode: true } },
    },
  });

  const userIds = [...new Set(baris.map((b) => b.dicatatOlehId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.email]));

  return baris.map((b) => ({
    id: b.id,
    nominal: b.nominal,
    keterangan: b.keterangan,
    createdAt: b.createdAt,
    periodeKode: b.periode.kode,
    dicatatOleh: userMap.get(b.dicatatOlehId) ?? "Admin",
  }));
}
