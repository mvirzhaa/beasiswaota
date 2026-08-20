import type { PrismaClient } from "@prisma/client";
import { generateJadwal } from "@/lib/komitmen/jadwal";

export interface HasilGenerateJadwalBerikutnya {
  komitmenDiproses: number;
  jadwalDibuat: number;
}

/**
 * Untuk semua Komitmen AKTIF yang belum habis jangka waktunya, generate
 * JadwalBayar untuk SATU periode berikutnya yang sudah benar-benar ada di
 * DB (lihat catatan di src/lib/komitmen/jadwal.ts — saat komitmen dibuat,
 * hanya periode pertama yang ditulis karena periode ke-2 dst umumnya
 * belum dibuat admin). Dipanggil dari POST /api/cron/jadwal-bayar.
 *
 * Idempoten: dicek dulu apakah JadwalBayar untuk pasangan
 * (komitmenId, periodeId) itu sudah ada sebelum menulis, plus constraint
 * unik di DB sebagai penjaga terakhir.
 */
export async function generateJadwalBerikutnyaUntukSemuaKomitmen(
  db: PrismaClient,
): Promise<HasilGenerateJadwalBerikutnya> {
  const komitmenAktif = await db.komitmen.findMany({
    where: { status: "AKTIF" },
    include: { jadwalBayar: { select: { periodeId: true }, distinct: ["periodeId"] } },
  });

  let jadwalDibuat = 0;
  let komitmenDiproses = 0;

  for (const komitmen of komitmenAktif) {
    const periodeSudahAda = komitmen.jadwalBayar.length;
    if (periodeSudahAda >= komitmen.jumlahPeriode) {
      continue;
    }

    const periodeIdSudahAda = komitmen.jadwalBayar.map((j) => j.periodeId);
    const periodeTerakhir =
      periodeIdSudahAda.length > 0
        ? await db.periode.findFirst({
            where: { id: { in: periodeIdSudahAda } },
            orderBy: { tglBuka: "desc" },
          })
        : null;

    const batasTglBuka = periodeTerakhir?.tglBuka ?? komitmen.tglMulai;

    const periodeBerikutnya = await db.periode.findFirst({
      where: {
        tglBuka: { gt: batasTglBuka },
        status: { notIn: ["DRAFT", "SELESAI"] },
        NOT: { id: { in: periodeIdSudahAda } },
      },
      orderBy: { tglBuka: "asc" },
    });

    if (!periodeBerikutnya) {
      continue;
    }

    komitmenDiproses += 1;

    const rencana = generateJadwal(
      { jumlahPeriode: 1, ritme: komitmen.ritme, nominalPerPeriode: komitmen.nominalPerPeriode },
      { tglBuka: periodeBerikutnya.tglBuka },
    );

    await db.jadwalBayar.createMany({
      data: rencana.map((b) => ({
        komitmenId: komitmen.id,
        periodeId: periodeBerikutnya.id,
        urutan: b.urutan,
        nominal: b.nominal,
        jatuhTempo: b.jatuhTempo,
      })),
      skipDuplicates: true,
    });
    jadwalDibuat += rencana.length;
  }

  return { komitmenDiproses, jadwalDibuat };
}
