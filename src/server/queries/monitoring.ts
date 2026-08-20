import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ambangRisikoSchema,
  KUNCI_PENGATURAN_AMBANG_RISIKO,
  type AmbangRisiko,
} from "@/lib/monitoring/risiko.schema";
import { hitungRisiko, type StatusAkademikMonitoring } from "@/lib/monitoring/risiko";
import { hitungBatasKirimLaporan } from "@/lib/monitoring/batas-laporan";

type TxClient = Prisma.TransactionClient;

/** Ambang risiko WAJIB dibaca dari Pengaturan (CLAUDE.md), jangan hardcode. */
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

async function ambilIpkSemesterLalu(
  tx: TxClient,
  mahasiswaId: string,
  periodeId: string,
): Promise<number | null> {
  const periodeSekarang = await tx.periode.findUnique({
    where: { id: periodeId },
    select: { tglBuka: true },
  });
  if (!periodeSekarang) return null;

  const lalu = await tx.monitoringAkademik.findFirst({
    where: { mahasiswaId, periode: { tglBuka: { lt: periodeSekarang.tglBuka } } },
    orderBy: { periode: { tglBuka: "desc" } },
    select: { ipk: true },
  });
  return lalu?.ipk !== null && lalu?.ipk !== undefined ? Number(lalu.ipk) : null;
}

export interface SimpanMonitoringInput {
  mahasiswaId: string;
  periodeId: string;
  ipSemester: number | null;
  ipk: number | null;
  sksSemester: number | null;
  sksKumulatif: number | null;
  statusAkademik: StatusAkademikMonitoring;
  persenKehadiran: number | null;
  sumberData?: "MANUAL" | "SIAKAD";
}

/**
 * Hitung risiko (pakai ambang & IPK semester lalu yang sesungguhnya) lalu
 * upsert satu baris MonitoringAkademik, di dalam transaksi yang sudah
 * dipegang pemanggil — dipakai baik untuk input satu mahasiswa maupun
 * loop impor massal, supaya keduanya lewat jalur perhitungan yang sama.
 */
export async function upsertMonitoringDalamTx(
  tx: TxClient,
  ambang: AmbangRisiko,
  input: SimpanMonitoringInput,
) {
  const ipkSemesterLalu = await ambilIpkSemesterLalu(tx, input.mahasiswaId, input.periodeId);

  const risiko = hitungRisiko(
    { ipk: input.ipk, ipkSemesterLalu, statusAkademik: input.statusAkademik },
    ambang,
  );

  return tx.monitoringAkademik.upsert({
    where: { mahasiswaId_periodeId: { mahasiswaId: input.mahasiswaId, periodeId: input.periodeId } },
    update: {
      ipSemester: input.ipSemester,
      ipk: input.ipk,
      sksSemester: input.sksSemester,
      sksKumulatif: input.sksKumulatif,
      statusAkademik: input.statusAkademik,
      persenKehadiran: input.persenKehadiran,
      risiko,
      sumberData: input.sumberData ?? "MANUAL",
      syncedAt: new Date(),
    },
    create: {
      mahasiswaId: input.mahasiswaId,
      periodeId: input.periodeId,
      ipSemester: input.ipSemester,
      ipk: input.ipk,
      sksSemester: input.sksSemester,
      sksKumulatif: input.sksKumulatif,
      statusAkademik: input.statusAkademik,
      persenKehadiran: input.persenKehadiran,
      risiko,
      sumberData: input.sumberData ?? "MANUAL",
    },
  });
}

/** Input satu mahasiswa di luar konteks impor massal — bungkus sendiri transaksinya. */
export async function simpanMonitoringSatuMahasiswa(input: SimpanMonitoringInput) {
  const ambang = await ambilAmbangRisiko();
  return prisma.$transaction((tx) => upsertMonitoringDalamTx(tx, ambang, input));
}

export interface PenerimaAktifAdmin {
  mahasiswaId: string;
  nama: string;
  nim: string;
  fakultas: string;
  prodi: string;
  risiko: "AMAN" | "PERHATIAN" | "KRITIS" | null;
  ipk: number | null;
  statusAkademik: string | null;
}

/** "Penerima aktif" = mahasiswa dengan Pengajuan DISETUJUI pada periode tsb. */
export async function ambilDaftarPenerimaAktifAdmin(
  periodeId: string,
  fakultas?: string,
): Promise<PenerimaAktifAdmin[]> {
  const pengajuan = await prisma.pengajuan.findMany({
    where: {
      periodeId,
      status: "DISETUJUI",
      ...(fakultas ? { mahasiswa: { fakultas } } : {}),
    },
    select: {
      mahasiswa: {
        select: { id: true, nama: true, nim: true, fakultas: true, prodi: true },
      },
    },
  });

  const hasil: PenerimaAktifAdmin[] = [];
  for (const p of pengajuan) {
    const monitoring = await prisma.monitoringAkademik.findUnique({
      where: { mahasiswaId_periodeId: { mahasiswaId: p.mahasiswa.id, periodeId } },
      select: { risiko: true, ipk: true, statusAkademik: true },
    });
    hasil.push({
      mahasiswaId: p.mahasiswa.id,
      nama: p.mahasiswa.nama,
      nim: p.mahasiswa.nim,
      fakultas: p.mahasiswa.fakultas,
      prodi: p.mahasiswa.prodi,
      risiko: monitoring?.risiko ?? null,
      ipk: monitoring?.ipk !== null && monitoring?.ipk !== undefined ? Number(monitoring.ipk) : null,
      statusAkademik: monitoring?.statusAkademik ?? null,
    });
  }
  return hasil;
}

export interface BelumLaporAdmin {
  mahasiswaId: string;
  nama: string;
  nim: string;
  batasKirim: Date;
  statusLaporan: string | null;
}

/** Penerima aktif yang laporan perkembangannya belum DIKIRIM/DIVERIFIKASI menjelang batas kirim. */
export async function ambilBelumLaporAdmin(periodeId: string, hariAmbang = 7): Promise<BelumLaporAdmin[]> {
  const periode = await prisma.periode.findUnique({ where: { id: periodeId } });
  if (!periode) return [];

  const batasKirim = hitungBatasKirimLaporan(periode);
  const batasAtasWaktu = new Date();
  batasAtasWaktu.setUTCDate(batasAtasWaktu.getUTCDate() + hariAmbang);
  if (batasKirim > batasAtasWaktu) {
    return [];
  }

  const penerima = await ambilDaftarPenerimaAktifAdmin(periodeId);
  const hasil: BelumLaporAdmin[] = [];
  for (const p of penerima) {
    const laporan = await prisma.laporanPerkembangan.findUnique({
      where: { mahasiswaId_periodeId: { mahasiswaId: p.mahasiswaId, periodeId } },
      select: { status: true },
    });
    if (!laporan || (laporan.status !== "DIKIRIM" && laporan.status !== "DIVERIFIKASI")) {
      hasil.push({
        mahasiswaId: p.mahasiswaId,
        nama: p.nama,
        nim: p.nim,
        batasKirim,
        statusLaporan: laporan?.status ?? null,
      });
    }
  }
  return hasil;
}
