"use server";

import { randomUUID, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { unggahBerkas, hapusBerkas } from "@/lib/storage/minio";
import { validasiBerkas } from "@/lib/berkas/validasi";
import {
  pengajuanSchema,
  jenisBerkasSchema,
  JENIS_BERKAS_WAJIB,
} from "@/lib/pengajuan/schema";
import { ambilMahasiswaIdUser } from "@/server/queries/pengajuan";
import type { HasilAksi } from "@/types/aksi";

async function sesiMahasiswa() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MAHASISWA") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export async function simpanPengajuan(
  periodeId: string,
  mode: "draft" | "submit",
  input: unknown,
): Promise<HasilAksi> {
  const user = await sesiMahasiswa();

  const parsed = pengajuanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const mahasiswaId = await ambilMahasiswaIdUser(user.id);

  const existing = await prisma.pengajuan.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId } },
    include: { berkas: true },
  });

  // Aturan: pengajuan hanya bisa diedit selama status DRAFT.
  if (existing && existing.status !== "DRAFT") {
    return {
      sukses: false,
      pesan: "Pengajuan hanya bisa diedit selama berstatus DRAFT.",
    };
  }

  if (mode === "submit") {
    const jenisTerunggah = new Set((existing?.berkas ?? []).map((b) => b.jenis));
    const kurang = JENIS_BERKAS_WAJIB.filter((j) => !jenisTerunggah.has(j));
    if (kurang.length > 0) {
      return {
        sukses: false,
        pesan: `Berkas berikut belum diunggah: ${kurang.join(", ")}.`,
      };
    }
  }

  const data = {
    nominalKebutuhan: parsed.data.nominalKebutuhan,
    penghasilanOrtu: parsed.data.penghasilanOrtu,
    jmlTanggungan: parsed.data.jmlTanggungan,
    statusOrtu: parsed.data.statusOrtu,
    alasan: parsed.data.alasan,
    status: mode === "submit" ? ("DIAJUKAN" as const) : ("DRAFT" as const),
  };

  try {
    await prisma.$transaction(async (tx) => {
      const pengajuan = existing
        ? await tx.pengajuan.update({ where: { id: existing.id }, data })
        : await tx.pengajuan.create({ data: { ...data, mahasiswaId, periodeId } });

      await catatAudit(tx, {
        aktorId: user.id,
        aksi: mode === "submit" ? "pengajuan.ajukan" : "pengajuan.simpan_draft",
        entitas: "pengajuan",
        entitasId: pengajuan.id,
        sebelum: existing ? { status: existing.status } : undefined,
        sesudah: { status: pengajuan.status },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        sukses: false,
        pesan: "Anda sudah memiliki pengajuan untuk periode ini.",
      };
    }
    throw error;
  }

  revalidatePath("/mahasiswa/pengajuan");
  return {
    sukses: true,
    pesan: mode === "submit" ? "Pengajuan berhasil diajukan." : "Draft tersimpan.",
  };
}

export async function unggahBerkasPengajuan(
  formData: FormData,
): Promise<HasilAksi> {
  const user = await sesiMahasiswa();

  const pengajuanId = formData.get("pengajuanId");
  const jenisRaw = formData.get("jenis");
  const file = formData.get("file");

  const jenisParsed = jenisBerkasSchema.safeParse(jenisRaw);
  if (
    typeof pengajuanId !== "string" ||
    !jenisParsed.success ||
    !(file instanceof File) ||
    file.size === 0
  ) {
    return { sukses: false, pesan: "Data unggahan tidak lengkap." };
  }
  const jenis = jenisParsed.data;

  const mahasiswaId = await ambilMahasiswaIdUser(user.id);

  const pengajuan = await prisma.pengajuan.findUnique({
    where: { id: pengajuanId },
  });
  // Cek kepemilikan di lapisan action (aturan keras #5, lapis ketiga) —
  // bukan cuma berasumsi dari layout.
  if (!pengajuan || pengajuan.mahasiswaId !== mahasiswaId) {
    return { sukses: false, pesan: "Pengajuan tidak ditemukan." };
  }
  if (pengajuan.status !== "DRAFT") {
    return {
      sukses: false,
      pesan: "Berkas hanya bisa diubah selama pengajuan berstatus DRAFT.",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validasi = validasiBerkas({
    mimeType: file.type,
    ukuranByte: buffer.length,
  });
  if (!validasi.valid) {
    return { sukses: false, pesan: validasi.pesan ?? "Berkas tidak valid." };
  }

  const checksum = createHash("sha256").update(buffer).digest("hex");
  const ekstensi = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const objectKey = `pengajuan/${pengajuanId}/${jenis}-${randomUUID()}.${ekstensi}`;

  await unggahBerkas(objectKey, buffer, file.type);

  const berkasLama = await prisma.pengajuanBerkas.findFirst({
    where: { pengajuanId, jenis },
  });

  await prisma.$transaction(async (tx) => {
    if (berkasLama) {
      await tx.pengajuanBerkas.update({
        where: { id: berkasLama.id },
        data: {
          objectKey,
          namaAsli: file.name,
          mimeType: file.type,
          ukuranByte: buffer.length,
          checksum,
          status: "MENUNGGU",
          catatan: null,
        },
      });
    } else {
      await tx.pengajuanBerkas.create({
        data: {
          pengajuanId,
          jenis,
          objectKey,
          namaAsli: file.name,
          mimeType: file.type,
          ukuranByte: buffer.length,
          checksum,
        },
      });
    }

    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "pengajuan.unggah_berkas",
      entitas: "pengajuan_berkas",
      entitasId: berkasLama?.id ?? pengajuanId,
      sesudah: { jenis, namaAsli: file.name },
    });
  });

  if (berkasLama) {
    await hapusBerkas(berkasLama.objectKey).catch(() => {
      // Berkas lama gagal dihapus (mis. sudah tidak ada) — tidak fatal,
      // baris DB sudah menunjuk ke objectKey yang baru.
    });
  }

  revalidatePath("/mahasiswa/pengajuan");
  return { sukses: true, pesan: "Berkas berhasil diunggah." };
}
