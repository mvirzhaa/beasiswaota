import { prisma } from "@/lib/db";
import {
  ambangRisikoSchema,
  KUNCI_PENGATURAN_AMBANG_RISIKO,
  type AmbangRisiko,
} from "@/lib/monitoring/risiko.schema";

/**
 * Ambang risiko TIDAK boleh hardcode (dipakai hitungRisiko di
 * src/lib/monitoring/risiko.ts) — selalu dibaca dari Pengaturan, sama
 * seperti pola bobot skoring di src/server/queries/skoring.ts. Baris hilang
 * atau bentuknya tidak valid harus meledak di sini, bukan diam-diam jatuh
 * ke default.
 */
export async function ambilAmbangRisiko(): Promise<AmbangRisiko> {
  const baris = await prisma.pengaturan.findUnique({
    where: { kunci: KUNCI_PENGATURAN_AMBANG_RISIKO },
  });

  if (!baris) {
    throw new Error(
      `Pengaturan "${KUNCI_PENGATURAN_AMBANG_RISIKO}" belum ada. Jalankan seed atau isi lewat admin.`,
    );
  }

  return ambangRisikoSchema.parse(baris.nilai);
}

export interface BarisMonitoringMahasiswa {
  id: string;
  periodeId: string;
  periodeKode: string;
  ipSemester: number | null;
  ipk: number | null;
  sksSemester: number | null;
  sksKumulatif: number | null;
  statusAkademik: string;
  persenKehadiran: number | null;
  risiko: string;
  sumberData: string;
  syncedAt: Date;
}

/** Data monitoring satu mahasiswa untuk satu periode tertentu — dipakai tab Monitoring di halaman detail admin. */
export async function ambilMonitoringMahasiswaPeriode(
  mahasiswaId: string,
  periodeId: string,
): Promise<BarisMonitoringMahasiswa | null> {
  const b = await prisma.monitoringAkademik.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId } },
    include: { periode: { select: { kode: true } } },
  });
  if (!b) return null;

  return {
    id: b.id,
    periodeId: b.periodeId,
    periodeKode: b.periode.kode,
    ipSemester: b.ipSemester !== null ? Number(b.ipSemester) : null,
    ipk: b.ipk !== null ? Number(b.ipk) : null,
    sksSemester: b.sksSemester,
    sksKumulatif: b.sksKumulatif,
    statusAkademik: b.statusAkademik,
    persenKehadiran: b.persenKehadiran !== null ? Number(b.persenKehadiran) : null,
    risiko: b.risiko,
    sumberData: b.sumberData,
    syncedAt: b.syncedAt,
  };
}

/** Riwayat monitoring satu mahasiswa lintas periode (terbaru dulu) — untuk tren IPK di tab Monitoring. */
export async function ambilRiwayatMonitoringMahasiswa(mahasiswaId: string): Promise<BarisMonitoringMahasiswa[]> {
  const baris = await prisma.monitoringAkademik.findMany({
    where: { mahasiswaId },
    include: { periode: { select: { kode: true } } },
    orderBy: { periode: { tglBuka: "desc" } },
  });

  return baris.map((b) => ({
    id: b.id,
    periodeId: b.periodeId,
    periodeKode: b.periode.kode,
    ipSemester: b.ipSemester !== null ? Number(b.ipSemester) : null,
    ipk: b.ipk !== null ? Number(b.ipk) : null,
    sksSemester: b.sksSemester,
    sksKumulatif: b.sksKumulatif,
    statusAkademik: b.statusAkademik,
    persenKehadiran: b.persenKehadiran !== null ? Number(b.persenKehadiran) : null,
    risiko: b.risiko,
    sumberData: b.sumberData,
    syncedAt: b.syncedAt,
  }));
}

/**
 * IPK semester paling akhir SEBELUM periode yang sedang diimpor/diinput,
 * per mahasiswa — dipakai hitungRisiko() untuk mendeteksi penurunan IPK.
 * Satu query batch untuk seluruh mahasiswa yang diimpor, bukan N+1.
 */
export async function ambilIpkSemesterLaluBatch(
  mahasiswaIds: string[],
  tglBukaPeriodeAktif: Date,
): Promise<Map<string, number | null>> {
  if (mahasiswaIds.length === 0) return new Map();

  const riwayat = await prisma.monitoringAkademik.findMany({
    where: {
      mahasiswaId: { in: mahasiswaIds },
      periode: { tglBuka: { lt: tglBukaPeriodeAktif } },
    },
    select: { mahasiswaId: true, ipk: true, periode: { select: { tglBuka: true } } },
    orderBy: { periode: { tglBuka: "desc" } },
  });

  const peta = new Map<string, number | null>();
  for (const r of riwayat) {
    if (!peta.has(r.mahasiswaId)) {
      peta.set(r.mahasiswaId, r.ipk !== null ? Number(r.ipk) : null);
    }
  }
  return peta;
}
