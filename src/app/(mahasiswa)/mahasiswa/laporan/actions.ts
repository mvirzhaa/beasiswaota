"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { unggahBerkas, hapusBerkas } from "@/lib/storage/minio";
import { validasiBerkas } from "@/lib/berkas/validasi";
import { hitungBatasKirimLaporan } from "@/lib/monitoring/batas-laporan";
import { laporanPerkembanganSchema } from "@/lib/monitoring/laporan.schema";
import { ambilMahasiswaIdUser } from "@/server/queries/pengajuan";
import { ambilLaporanMilikMahasiswa } from "@/server/queries/laporan-perkembangan";
import type { HasilAksi } from "@/types/aksi";

async function sesiMahasiswa() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MAHASISWA") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function simpanLaporan(
  periodeId: string,
  mode: "draft" | "submit",
  input: unknown,
): Promise<HasilAksi> {
  const user = await sesiMahasiswa();

  const parsed = laporanPerkembanganSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const mahasiswaId = await ambilMahasiswaIdUser(user.id);

  const periode = await prisma.periode.findUnique({ where: { id: periodeId } });
  if (!periode) {
    return { sukses: false, pesan: "Periode tidak ditemukan." };
  }

  const existing = await prisma.laporanPerkembangan.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId } },
  });

  if (existing && existing.status !== "DRAFT" && existing.status !== "PERLU_REVISI") {
    return { sukses: false, pesan: "Laporan yang sudah dikirim/diverifikasi tidak bisa diedit lagi." };
  }

  const data = {
    isi: parsed.data.isi,
    status: mode === "submit" ? ("DIKIRIM" as const) : ("DRAFT" as const),
    dikirimAt: mode === "submit" ? new Date() : existing?.dikirimAt ?? null,
  };

  await prisma.$transaction(async (tx) => {
    const laporan = existing
      ? await tx.laporanPerkembangan.update({ where: { id: existing.id }, data })
      : await tx.laporanPerkembangan.create({
          data: {
            ...data,
            mahasiswaId,
            periodeId,
            batasKirim: hitungBatasKirimLaporan(periode),
          },
        });

    await catatAudit(tx, {
      aktorId: user.id,
      aksi: mode === "submit" ? "laporan.kirim" : "laporan.simpan_draft",
      entitas: "laporan_perkembangan",
      entitasId: laporan.id,
      sebelum: existing ? { status: existing.status } : undefined,
      sesudah: { status: laporan.status },
    });
  });

  revalidatePath("/mahasiswa/laporan");
  return {
    sukses: true,
    pesan: mode === "submit" ? "Laporan berhasil dikirim." : "Draft tersimpan.",
  };
}

export async function unggahLampiranLaporan(formData: FormData): Promise<HasilAksi> {
  const user = await sesiMahasiswa();

  const laporanId = formData.get("laporanId");
  const file = formData.get("file");
  if (typeof laporanId !== "string" || !(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "Data unggahan tidak lengkap." };
  }

  const laporan = await ambilLaporanMilikMahasiswa(laporanId, user.id);
  if (!laporan) {
    return { sukses: false, pesan: "Laporan tidak ditemukan." };
  }
  if (laporan.status !== "DRAFT" && laporan.status !== "PERLU_REVISI") {
    return { sukses: false, pesan: "Lampiran hanya bisa diubah selama laporan belum dikirim." };
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
      aktorId: user.id,
      aksi: "laporan.unggah_lampiran",
      entitas: "laporan_perkembangan",
      entitasId: laporanId,
      sesudah: { namaAsli: file.name },
    });
  });

  if (lampiranLama) {
    await hapusBerkas(lampiranLama).catch(() => {});
  }

  revalidatePath("/mahasiswa/laporan");
  return { sukses: true, pesan: "Lampiran berhasil diunggah." };
}

export async function togglBolehDibacaPembina(laporanId: string, boleh: boolean): Promise<HasilAksi> {
  const user = await sesiMahasiswa();

  const laporan = await ambilLaporanMilikMahasiswa(laporanId, user.id);
  if (!laporan) {
    return { sukses: false, pesan: "Laporan tidak ditemukan." };
  }

  await prisma.laporanPerkembangan.update({
    where: { id: laporanId },
    data: { bolehDibacaPembina: boleh },
  });

  revalidatePath("/mahasiswa/laporan");
  return { sukses: true, pesan: boleh ? "Laporan boleh dibaca pembina." : "Laporan disembunyikan dari pembina." };
}
