"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { ambilMetaPermintaan } from "@/lib/request-meta";
import { inputMonitoringSchema } from "@/lib/monitoring/schema";
import { parseBarisMonitoring, type BarisMonitoringValid } from "@/lib/monitoring/xlsx-parse";
import { bacaBarisXlsxMonitoring } from "@/lib/monitoring/xlsx-io";
import { simpanMonitoringSatuMahasiswa, ambilAmbangRisiko, upsertMonitoringDalamTx } from "@/server/queries/monitoring";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function simpanMonitoring(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = inputMonitoringSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const hasil = await simpanMonitoringSatuMahasiswa(parsed.data);
    await catatAudit(prisma, {
      aktorId: admin.id,
      aksi: "monitoring.simpan",
      entitas: "monitoring_akademik",
      entitasId: hasil.id,
      sesudah: { risiko: hasil.risiko, statusAkademik: hasil.statusAkademik },
      ipAddress,
      userAgent,
    });
  } catch (error) {
    return { sukses: false, pesan: error instanceof Error ? error.message : "Gagal menyimpan." };
  }

  revalidatePath("/admin/monitoring");
  return { sukses: true, pesan: "Data monitoring tersimpan." };
}

export interface HasilPratinjauImpor {
  sukses: boolean;
  pesan: string;
  valid?: (BarisMonitoringValid & { mahasiswaId: string | null; namaMahasiswa: string | null })[];
  error?: { baris: number; pesan: string }[];
}

export async function pratinjauImporMonitoring(
  periodeId: string,
  formData: FormData,
): Promise<HasilPratinjauImpor> {
  await sesiAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "File XLSX wajib diunggah." };
  }
  if (!periodeId) {
    return { sukses: false, pesan: "Pilih periode dulu." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const barisMentah = await bacaBarisXlsxMonitoring(buffer);
  const { valid, error } = parseBarisMonitoring(barisMentah);

  const nimList = valid.map((v) => v.nim);
  const mahasiswaList = await prisma.mahasiswa.findMany({
    where: { nim: { in: nimList } },
    select: { id: true, nim: true, nama: true },
  });
  const petaNim = new Map(mahasiswaList.map((m) => [m.nim, m]));

  const validDenganMahasiswa = valid.map((v) => {
    const m = petaNim.get(v.nim);
    return { ...v, mahasiswaId: m?.id ?? null, namaMahasiswa: m?.nama ?? null };
  });

  const nimTidakDitemukan = validDenganMahasiswa.filter((v) => v.mahasiswaId === null);
  const errorGabungan = [
    ...error,
    ...nimTidakDitemukan.map((v) => ({ baris: v.baris, pesan: `NIM ${v.nim} tidak ditemukan` })),
  ];

  return {
    sukses: true,
    pesan: `${validDenganMahasiswa.length - nimTidakDitemukan.length} baris siap disimpan, ${errorGabungan.length} baris bermasalah.`,
    valid: validDenganMahasiswa,
    error: errorGabungan,
  };
}

export async function komitImporMonitoring(periodeId: string, dataJson: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  if (!periodeId) {
    return { sukses: false, pesan: "Periode tidak valid." };
  }

  let barisKlien: BarisMonitoringValid[];
  try {
    barisKlien = JSON.parse(dataJson);
  } catch {
    return { sukses: false, pesan: "Data pratinjau tidak valid, ulangi dari unggah file." };
  }

  // Re-validasi penuh di sini (bukan sekadar percaya JSON dari klien) —
  // termasuk resolusi NIM -> mahasiswaId diambil ULANG dari DB, bukan dari
  // field yang dikirim klien, supaya tidak bisa dipalsukan untuk menimpa
  // data mahasiswa lain.
  const { valid, error } = parseBarisMonitoring(
    barisKlien.map((b) => ({
      baris: b.baris,
      data: {
        nim: b.nim,
        ipSemester: b.ipSemester,
        ipk: b.ipk,
        sksSemester: b.sksSemester,
        sksKumulatif: b.sksKumulatif,
        statusAkademik: b.statusAkademik,
        persenKehadiran: b.persenKehadiran,
      },
    })),
  );
  if (error.length > 0) {
    return { sukses: false, pesan: `${error.length} baris tidak valid saat validasi ulang, ulangi dari unggah file.` };
  }

  const mahasiswaList = await prisma.mahasiswa.findMany({
    where: { nim: { in: valid.map((v) => v.nim) } },
    select: { id: true, nim: true },
  });
  const petaNim = new Map(mahasiswaList.map((m) => [m.nim, m.id]));

  const tidakDitemukan = valid.filter((v) => !petaNim.has(v.nim));
  if (tidakDitemukan.length > 0) {
    return {
      sukses: false,
      pesan: `NIM tidak ditemukan: ${tidakDitemukan.map((v) => v.nim).join(", ")}. Ulangi dari unggah file.`,
    };
  }

  const ambang = await ambilAmbangRisiko();

  await prisma.$transaction(async (tx) => {
    for (const baris of valid) {
      const mahasiswaId = petaNim.get(baris.nim)!;
      await upsertMonitoringDalamTx(tx, ambang, {
        mahasiswaId,
        periodeId,
        ipSemester: baris.ipSemester,
        ipk: baris.ipk,
        sksSemester: baris.sksSemester,
        sksKumulatif: baris.sksKumulatif,
        statusAkademik: baris.statusAkademik,
        persenKehadiran: baris.persenKehadiran,
      });
    }

    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "monitoring.impor_massal",
      entitas: "periode",
      entitasId: periodeId,
      sesudah: { jumlahBaris: valid.length },
      ipAddress,
      userAgent,
    });
  });

  revalidatePath("/admin/monitoring");
  return { sukses: true, pesan: `${valid.length} baris berhasil disimpan.` };
}
