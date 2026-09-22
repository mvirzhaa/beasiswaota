"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { ambilMetaPermintaan } from "@/lib/request-meta";
import { unggahBerkas, hapusBerkas } from "@/lib/storage/minio";
import { validasiBerkas } from "@/lib/berkas/validasi";
import { buatMahasiswaSchema, ubahMahasiswaSchema, tagihanSchema } from "@/lib/mahasiswa/schema";
import { parseRupiah } from "@/lib/uang";
import { laporanPerkembanganSchema } from "@/lib/monitoring/laporan.schema";
import { hitungBatasKirimLaporan } from "@/lib/monitoring/batas-laporan";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

// ============================================================================
// Data dasar Mahasiswa — mahasiswa tidak punya akun/login (lihat CLAUDE.md),
// jadi semua field diisi admin langsung, tanpa email/password.
// ============================================================================

export async function buatMahasiswa(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = buatMahasiswaSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const mahasiswa = await prisma.$transaction(async (tx) => {
      const dibuat = await tx.mahasiswa.create({ data: parsed.data });
      await catatAudit(tx, {
        aktorId: admin.id,
        aksi: "mahasiswa.buat",
        entitas: "mahasiswa",
        entitasId: dibuat.id,
        sesudah: { nim: dibuat.nim, nama: dibuat.nama },
        ipAddress,
        userAgent,
      });
      return dibuat;
    });

    revalidatePath("/admin/mahasiswa");
    return { sukses: true, pesan: `Mahasiswa ${mahasiswa.nama} berhasil ditambahkan.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { sukses: false, pesan: "NIM sudah terdaftar." };
    }
    throw error;
  }
}

export async function ubahMahasiswa(mahasiswaId: string, formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = ubahMahasiswaSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const sebelum = await prisma.mahasiswa.findUnique({ where: { id: mahasiswaId } });
  if (!sebelum) {
    return { sukses: false, pesan: "Mahasiswa tidak ditemukan." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.mahasiswa.update({ where: { id: mahasiswaId }, data: parsed.data });
      await catatAudit(tx, {
        aktorId: admin.id,
        aksi: "mahasiswa.ubah",
        entitas: "mahasiswa",
        entitasId: mahasiswaId,
        sebelum: { nama: sebelum.nama, statusAkademik: sebelum.statusAkademik },
        sesudah: { nama: parsed.data.nama, statusAkademik: parsed.data.statusAkademik },
        ipAddress,
        userAgent,
      });
    });

    revalidatePath(`/admin/mahasiswa/${mahasiswaId}`);
    revalidatePath("/admin/mahasiswa");
    return { sukses: true, pesan: "Data mahasiswa diperbarui." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { sukses: false, pesan: "NIM sudah dipakai mahasiswa lain." };
    }
    throw error;
  }
}

// ============================================================================
// Tagihan UKT — admin mencatat KEWAJIBAN bayar per periode. `terbayar` &
// `status` TIDAK PERNAH ditulis di sini, hanya lewat setujuiBatch() (lihat
// src/lib/alokasi/engine.ts, aturan keras #3).
// ============================================================================

export async function buatTagihan(mahasiswaId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = tagihanSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  let nominal: bigint;
  try {
    nominal = parseRupiah(parsed.data.nominal);
  } catch {
    return { sukses: false, pesan: "Nominal tidak valid." };
  }
  if (nominal <= 0n) {
    return { sukses: false, pesan: "Nominal harus lebih besar dari nol." };
  }

  try {
    const tagihan = await prisma.$transaction(async (tx) => {
      const dibuat = await tx.tagihan.create({
        data: {
          mahasiswaId,
          periodeId: parsed.data.periodeId,
          komponen: parsed.data.komponen,
          nominal,
          jatuhTempo: new Date(parsed.data.jatuhTempo),
        },
      });
      await catatAudit(tx, {
        aktorId: admin.id,
        aksi: "tagihan.buat",
        entitas: "tagihan",
        entitasId: dibuat.id,
        sesudah: { mahasiswaId, periodeId: dibuat.periodeId, komponen: dibuat.komponen, nominal: dibuat.nominal.toString() },
        ipAddress,
        userAgent,
      });
      return dibuat;
    });

    revalidatePath(`/admin/mahasiswa/${mahasiswaId}`);
    return { sukses: true, pesan: `Tagihan ${tagihan.komponen} berhasil ditambahkan.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { sukses: false, pesan: "Tagihan dengan komponen & periode ini sudah ada." };
    }
    throw error;
  }
}

export async function ubahTagihan(tagihanId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  const parsed = tagihanSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  let nominal: bigint;
  try {
    nominal = parseRupiah(parsed.data.nominal);
  } catch {
    return { sukses: false, pesan: "Nominal tidak valid." };
  }
  if (nominal <= 0n) {
    return { sukses: false, pesan: "Nominal harus lebih besar dari nol." };
  }

  const sebelum = await prisma.tagihan.findUnique({ where: { id: tagihanId } });
  if (!sebelum) {
    return { sukses: false, pesan: "Tagihan tidak ditemukan." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sesudah = await tx.tagihan.update({
        where: { id: tagihanId },
        data: {
          komponen: parsed.data.komponen,
          nominal,
          jatuhTempo: new Date(parsed.data.jatuhTempo),
        },
      });
      await catatAudit(tx, {
        aktorId: admin.id,
        aksi: "tagihan.ubah",
        entitas: "tagihan",
        entitasId: tagihanId,
        sebelum: { komponen: sebelum.komponen, nominal: sebelum.nominal.toString(), jatuhTempo: sebelum.jatuhTempo.toISOString() },
        sesudah: { komponen: sesudah.komponen, nominal: sesudah.nominal.toString(), jatuhTempo: sesudah.jatuhTempo.toISOString() },
        ipAddress,
        userAgent,
      });
    });

    revalidatePath(`/admin/mahasiswa/${sebelum.mahasiswaId}`);
    return { sukses: true, pesan: "Tagihan berhasil diperbarui." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { sukses: false, pesan: "Tagihan dengan komponen & periode ini sudah ada." };
    }
    throw error;
  }
}

// ============================================================================
// Laporan Perkembangan — dulu diisi mahasiswa sendiri, sekarang admin.
// ============================================================================

const STATUS_LAPORAN_TERKUNCI = ["DIVERIFIKASI"];

export async function simpanLaporanAdmin(
  mahasiswaId: string,
  periodeId: string,
  mode: "draft" | "submit",
  input: unknown,
): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = laporanPerkembanganSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const periode = await prisma.periode.findUnique({ where: { id: periodeId } });
  if (!periode) {
    return { sukses: false, pesan: "Periode tidak ditemukan." };
  }

  const existing = await prisma.laporanPerkembangan.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId } },
  });

  if (existing && STATUS_LAPORAN_TERKUNCI.includes(existing.status)) {
    return { sukses: false, pesan: "Laporan yang sudah diverifikasi tidak bisa diedit lagi." };
  }

  const data = {
    isi: parsed.data.isi,
    status: mode === "submit" ? ("DIKIRIM" as const) : ("DRAFT" as const),
    dikirimAt: mode === "submit" ? new Date() : (existing?.dikirimAt ?? null),
  };

  await prisma.$transaction(async (tx) => {
    const laporan = existing
      ? await tx.laporanPerkembangan.update({ where: { id: existing.id }, data })
      : await tx.laporanPerkembangan.create({
          data: { ...data, mahasiswaId, periodeId, batasKirim: hitungBatasKirimLaporan(periode) },
        });

    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: mode === "submit" ? "laporan.kirim" : "laporan.simpan_draft",
      entitas: "laporan_perkembangan",
      entitasId: laporan.id,
      sebelum: existing ? { status: existing.status } : undefined,
      sesudah: { status: laporan.status },
    });
  });

  revalidatePath(`/admin/mahasiswa/${mahasiswaId}`);
  return { sukses: true, pesan: mode === "submit" ? "Laporan berhasil dikirim." : "Draft tersimpan." };
}

export async function unggahLampiranLaporanAdmin(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const laporanId = formData.get("laporanId");
  const file = formData.get("file");
  if (typeof laporanId !== "string" || !(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "Data unggahan tidak lengkap." };
  }

  const laporan = await prisma.laporanPerkembangan.findUnique({ where: { id: laporanId } });
  if (!laporan) {
    return { sukses: false, pesan: "Laporan tidak ditemukan." };
  }
  if (STATUS_LAPORAN_TERKUNCI.includes(laporan.status)) {
    return { sukses: false, pesan: "Laporan yang sudah diverifikasi tidak bisa diubah lagi." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validasi = validasiBerkas({ mimeType: file.type, ukuranByte: buffer.length });
  if (!validasi.valid) {
    return { sukses: false, pesan: validasi.pesan ?? "Berkas tidak valid." };
  }

  const ekstensi = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const objectKey = `laporan/${laporanId}/${randomUUID()}.${ekstensi}`;
  await unggahBerkas(objectKey, buffer, file.type);

  const lampiranLama = laporan.lampiranKey;

  await prisma.$transaction(async (tx) => {
    await tx.laporanPerkembangan.update({ where: { id: laporanId }, data: { lampiranKey: objectKey } });
    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "laporan.unggah_lampiran",
      entitas: "laporan_perkembangan",
      entitasId: laporanId,
      sesudah: { namaAsli: file.name },
    });
  });

  if (lampiranLama) {
    await hapusBerkas(lampiranLama).catch(() => {});
  }

  revalidatePath(`/admin/mahasiswa/${laporan.mahasiswaId}`);
  return { sukses: true, pesan: "Lampiran berhasil diunggah." };
}

export async function togglBolehDibacaPembinaAdmin(laporanId: string, boleh: boolean): Promise<HasilAksi> {
  await sesiAdmin();

  const laporan = await prisma.laporanPerkembangan.findUnique({ where: { id: laporanId } });
  if (!laporan) {
    return { sukses: false, pesan: "Laporan tidak ditemukan." };
  }

  await prisma.laporanPerkembangan.update({
    where: { id: laporanId },
    data: { bolehDibacaPembina: boleh },
  });

  revalidatePath(`/admin/mahasiswa/${laporan.mahasiswaId}`);
  return { sukses: true, pesan: boleh ? "Laporan boleh dibaca pembina." : "Laporan disembunyikan dari pembina." };
}
