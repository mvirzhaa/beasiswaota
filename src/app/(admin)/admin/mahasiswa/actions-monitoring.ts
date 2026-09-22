"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { ambilMetaPermintaan } from "@/lib/request-meta";
import { bacaBarisXlsxMonitoring } from "@/lib/monitoring/xlsx-io";
import { parseBarisMonitoring } from "@/lib/monitoring/xlsx-parse";
import { hitungRisiko } from "@/lib/monitoring/risiko";
import { inputMonitoringSchema } from "@/lib/monitoring/schema";
import { ambilAmbangRisiko, ambilIpkSemesterLaluBatch } from "@/server/queries/monitoring";
import type { HasilAksi } from "@/types/aksi";

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const UKURAN_MAKS_BYTE = 5 * 1024 * 1024; // 5MB

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export interface HasilImporMonitoring extends HasilAksi {
  jumlahSukses?: number;
  errorBaris?: { baris: number; pesan: string }[];
}

/**
 * Impor massal hasil studi (IPK, IP semester, SKS, status akademik) dari
 * file XLSX SIAKAD — data terstruktur ini yang dipakai kartu risiko &
 * ditampilkan ke donatur pembina (lihat ambilDaftarBinaanOrtuAsuh di
 * server/queries/relasi.ts), BEDA dari scan KHS/lampiran narasi di
 * LaporanPerkembangan. Bulk (lintas banyak mahasiswa), jadi tombolnya di
 * halaman daftar Kelola Data Mahasiswa, bukan di halaman detail satu orang.
 * Baris valid tetap ditulis walau sebagian baris lain gagal — admin melihat
 * rincian baris mana yang gagal dan kenapa, lalu bisa perbaiki sumbernya
 * dan impor ulang baris itu saja.
 */
export async function imporMonitoringXlsx(formData: FormData): Promise<HasilImporMonitoring> {
  const admin = await sesiAdmin();

  const periodeId = formData.get("periodeId");
  const file = formData.get("file");
  if (typeof periodeId !== "string" || !periodeId || !(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "Pilih periode dan berkas XLSX terlebih dahulu." };
  }
  if (file.type !== MIME_XLSX) {
    return { sukses: false, pesan: "Format berkas harus .xlsx." };
  }
  if (file.size > UKURAN_MAKS_BYTE) {
    return { sukses: false, pesan: "Ukuran berkas maksimal 5MB." };
  }

  const periode = await prisma.periode.findUnique({ where: { id: periodeId } });
  if (!periode) {
    return { sukses: false, pesan: "Periode tidak ditemukan." };
  }
  if (periode.status === "SELESAI") {
    return { sukses: false, pesan: "Periode ini sudah terkunci, tidak bisa dicatat data monitoring baru." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const barisMentah = await bacaBarisXlsxMonitoring(buffer);
  if (barisMentah.length === 0) {
    return { sukses: false, pesan: "Berkas kosong atau tidak sesuai format template." };
  }

  const { valid, error } = parseBarisMonitoring(barisMentah);

  const nimList = [...new Set(valid.map((v) => v.nim))];
  const mahasiswaList = await prisma.mahasiswa.findMany({
    where: { nim: { in: nimList } },
    select: { id: true, nim: true },
  });
  const petaNimKeId = new Map(mahasiswaList.map((m) => [m.nim, m.id]));

  const errorBaris = [...error];
  const siapTulis: { baris: number; mahasiswaId: string; data: (typeof valid)[number] }[] = [];
  for (const v of valid) {
    const mahasiswaId = petaNimKeId.get(v.nim);
    if (!mahasiswaId) {
      errorBaris.push({ baris: v.baris, pesan: `NIM "${v.nim}" tidak ditemukan di data mahasiswa.` });
      continue;
    }
    siapTulis.push({ baris: v.baris, mahasiswaId, data: v });
  }

  if (siapTulis.length === 0) {
    return {
      sukses: false,
      pesan: "Tidak ada baris valid yang bisa disimpan.",
      jumlahSukses: 0,
      errorBaris: errorBaris.sort((a, b) => a.baris - b.baris),
    };
  }

  const ambang = await ambilAmbangRisiko();
  const ipkSemesterLaluPeta = await ambilIpkSemesterLaluBatch(
    siapTulis.map((s) => s.mahasiswaId),
    periode.tglBuka,
  );

  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  await prisma.$transaction(async (tx) => {
    for (const s of siapTulis) {
      const risiko = hitungRisiko(
        {
          ipk: s.data.ipk,
          ipkSemesterLalu: ipkSemesterLaluPeta.get(s.mahasiswaId) ?? null,
          statusAkademik: s.data.statusAkademik,
        },
        ambang,
      );

      await tx.monitoringAkademik.upsert({
        where: { mahasiswaId_periodeId: { mahasiswaId: s.mahasiswaId, periodeId } },
        create: {
          mahasiswaId: s.mahasiswaId,
          periodeId,
          ipSemester: s.data.ipSemester,
          ipk: s.data.ipk,
          sksSemester: s.data.sksSemester,
          sksKumulatif: s.data.sksKumulatif,
          statusAkademik: s.data.statusAkademik,
          persenKehadiran: s.data.persenKehadiran,
          risiko,
          sumberData: "SIAKAD",
        },
        update: {
          ipSemester: s.data.ipSemester,
          ipk: s.data.ipk,
          sksSemester: s.data.sksSemester,
          sksKumulatif: s.data.sksKumulatif,
          statusAkademik: s.data.statusAkademik,
          persenKehadiran: s.data.persenKehadiran,
          risiko,
          sumberData: "SIAKAD",
          syncedAt: new Date(),
        },
      });
    }

    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "monitoring.impor_xlsx",
      entitas: "monitoring_akademik",
      entitasId: periodeId,
      sesudah: {
        periodeId,
        namaBerkas: file.name,
        jumlahSukses: siapTulis.length,
        jumlahGagal: errorBaris.length,
      },
      ipAddress,
      userAgent,
    });
  });

  revalidatePath("/admin/mahasiswa");
  return {
    sukses: true,
    pesan: `${siapTulis.length} baris tersimpan${errorBaris.length > 0 ? `, ${errorBaris.length} baris gagal (lihat rincian).` : "."}`,
    jumlahSukses: siapTulis.length,
    errorBaris: errorBaris.sort((a, b) => a.baris - b.baris),
  };
}

/** Input/koreksi satu baris monitoring untuk satu mahasiswa — dipakai tab Monitoring di halaman detail admin. */
export async function simpanMonitoringManual(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = inputMonitoringSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const input = parsed.data;

  const periode = await prisma.periode.findUnique({ where: { id: input.periodeId } });
  if (!periode) {
    return { sukses: false, pesan: "Periode tidak ditemukan." };
  }
  if (periode.status === "SELESAI") {
    return { sukses: false, pesan: "Periode ini sudah terkunci, tidak bisa dicatat data monitoring baru." };
  }

  const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id: input.mahasiswaId } });
  if (!mahasiswa) {
    return { sukses: false, pesan: "Mahasiswa tidak ditemukan." };
  }

  const ambang = await ambilAmbangRisiko();
  const ipkSemesterLaluPeta = await ambilIpkSemesterLaluBatch([input.mahasiswaId], periode.tglBuka);
  const risiko = hitungRisiko(
    {
      ipk: input.ipk,
      ipkSemesterLalu: ipkSemesterLaluPeta.get(input.mahasiswaId) ?? null,
      statusAkademik: input.statusAkademik,
    },
    ambang,
  );

  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  await prisma.$transaction(async (tx) => {
    const baris = await tx.monitoringAkademik.upsert({
      where: { mahasiswaId_periodeId: { mahasiswaId: input.mahasiswaId, periodeId: input.periodeId } },
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
        sumberData: "MANUAL",
      },
      update: {
        ipSemester: input.ipSemester,
        ipk: input.ipk,
        sksSemester: input.sksSemester,
        sksKumulatif: input.sksKumulatif,
        statusAkademik: input.statusAkademik,
        persenKehadiran: input.persenKehadiran,
        risiko,
        sumberData: "MANUAL",
        syncedAt: new Date(),
      },
    });

    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "monitoring.simpan_manual",
      entitas: "monitoring_akademik",
      entitasId: baris.id,
      sesudah: { mahasiswaId: input.mahasiswaId, periodeId: input.periodeId, ipk: input.ipk, risiko },
      ipAddress,
      userAgent,
    });
  });

  revalidatePath(`/admin/mahasiswa/${input.mahasiswaId}`);
  return { sukses: true, pesan: "Data monitoring tersimpan." };
}
