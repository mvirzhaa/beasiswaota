"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { ambilMetaPermintaan } from "@/lib/request-meta";
import {
  tugaskanRelasiSchema,
  alihkanRelasiSchema,
  akhiriRelasiSchema,
} from "@/lib/pembinaan/schema";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function tugaskanRelasi(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = tugaskanRelasiSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const input = parsed.data;

  const sudahAda = await prisma.relasiAsuh.findFirst({
    where: { ortuAsuhId: input.ortuAsuhId, mahasiswaId: input.mahasiswaId, status: "AKTIF" },
  });
  if (sudahAda) {
    return {
      sukses: false,
      pesan: "Pasangan donatur-mahasiswa ini sudah punya relasi aktif. Akhiri atau alihkan dulu yang lama.",
    };
  }

  const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id: input.mahasiswaId } });
  if (!mahasiswa) {
    return { sukses: false, pesan: "Mahasiswa tidak ditemukan." };
  }

  const relasi = await prisma.$transaction(async (tx) => {
    const dibuat = await tx.relasiAsuh.create({
      data: {
        ortuAsuhId: input.ortuAsuhId,
        mahasiswaId: input.mahasiswaId,
        periodeMulaiId: input.periodeMulaiId,
        tglMulai: new Date(),
        ditugaskanOlehId: admin.id,
        catatan: input.catatan?.trim() || null,
      },
    });

    await tx.notifikasi.create({
      data: {
        userId: mahasiswa.userId,
        kanal: "INAPP",
        judul: "Permintaan pemantauan dari orang tua asuh",
        isi: "Seorang orang tua asuh ditugaskan admin untuk memantau progres Anda. Silakan tinjau dan setujui atau tolak di halaman Pembinaan.",
        tautan: "/mahasiswa/pembinaan",
      },
    });

    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "relasi.tugaskan",
      entitas: "relasi_asuh",
      entitasId: dibuat.id,
      sesudah: { ortuAsuhId: input.ortuAsuhId, mahasiswaId: input.mahasiswaId },
      ipAddress,
      userAgent,
    });

    return dibuat;
  });

  revalidatePath("/admin/pembinaan");
  return { sukses: true, pesan: `Relasi dibuat (ID ${relasi.id}), menunggu persetujuan mahasiswa.` };
}

export async function alihkanRelasi(relasiId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = alihkanRelasiSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const relasiLama = await prisma.relasiAsuh.findUnique({ where: { id: relasiId } });
  if (!relasiLama) {
    return { sukses: false, pesan: "Relasi tidak ditemukan." };
  }
  if (relasiLama.status !== "AKTIF") {
    return { sukses: false, pesan: "Hanya relasi berstatus AKTIF yang bisa dialihkan." };
  }

  const sudahAda = await prisma.relasiAsuh.findFirst({
    where: {
      ortuAsuhId: parsed.data.ortuAsuhBaruId,
      mahasiswaId: relasiLama.mahasiswaId,
      status: "AKTIF",
    },
  });
  if (sudahAda) {
    return { sukses: false, pesan: "Pembina baru sudah punya relasi aktif dengan mahasiswa ini." };
  }

  const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id: relasiLama.mahasiswaId } });
  if (!mahasiswa) {
    return { sukses: false, pesan: "Mahasiswa tidak ditemukan." };
  }

  const relasiBaru = await prisma.$transaction(async (tx) => {
    await tx.relasiAsuh.update({
      where: { id: relasiId },
      data: { status: "DIALIHKAN", tglSelesai: new Date(), alasanBerakhir: parsed.data.alasan },
    });

    const dibuat = await tx.relasiAsuh.create({
      data: {
        ortuAsuhId: parsed.data.ortuAsuhBaruId,
        mahasiswaId: relasiLama.mahasiswaId,
        periodeMulaiId: parsed.data.periodeMulaiId,
        tglMulai: new Date(),
        ditugaskanOlehId: admin.id,
        // Persetujuan TIDAK dibawa dari relasi lama — mahasiswa perlu
        // menyetujui ulang untuk pembina yang baru (aturan keras #11).
      },
    });

    await tx.notifikasi.create({
      data: {
        userId: mahasiswa.userId,
        kanal: "INAPP",
        judul: "Pembina Anda dialihkan",
        isi: "Anda dialihkan ke orang tua asuh baru. Silakan tinjau dan setujui atau tolak pemantauan di halaman Pembinaan.",
        tautan: "/mahasiswa/pembinaan",
      },
    });

    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "relasi.alihkan",
      entitas: "relasi_asuh",
      entitasId: relasiId,
      sebelum: { ortuAsuhId: relasiLama.ortuAsuhId, status: "AKTIF" },
      sesudah: { relasiBaruId: dibuat.id, ortuAsuhId: parsed.data.ortuAsuhBaruId, alasan: parsed.data.alasan },
      ipAddress,
      userAgent,
    });

    return dibuat;
  });

  revalidatePath("/admin/pembinaan");
  return { sukses: true, pesan: `Relasi dialihkan, relasi baru dibuat (ID ${relasiBaru.id}).` };
}

export async function akhiriRelasi(relasiId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = akhiriRelasiSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Alasan wajib diisi." };
  }

  const relasi = await prisma.relasiAsuh.findUnique({ where: { id: relasiId } });
  if (!relasi) {
    return { sukses: false, pesan: "Relasi tidak ditemukan." };
  }
  if (relasi.status !== "AKTIF") {
    return { sukses: false, pesan: "Hanya relasi berstatus AKTIF yang bisa diakhiri." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.relasiAsuh.update({
      where: { id: relasiId },
      data: { status: "SELESAI", tglSelesai: new Date(), alasanBerakhir: parsed.data.alasan },
    });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "relasi.akhiri",
      entitas: "relasi_asuh",
      entitasId: relasiId,
      sebelum: { status: "AKTIF" },
      sesudah: { status: "SELESAI", alasan: parsed.data.alasan },
      ipAddress,
      userAgent,
    });
  });

  revalidatePath("/admin/pembinaan");
  return { sukses: true, pesan: "Relasi diakhiri." };
}
