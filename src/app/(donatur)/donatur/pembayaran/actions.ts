"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { unggahBerkas } from "@/lib/storage/minio";
import { validasiBerkas } from "@/lib/berkas/validasi";
import { unggahBuktiTransferSchema } from "@/lib/transaksi/schema";
import { ambilOrtuAsuhIdUser } from "@/server/queries/komitmen";
import { ambilJadwalBayarMilikOrtuAsuh } from "@/server/queries/transaksi";
import type { HasilAksi } from "@/types/aksi";

async function sesiOrtuAsuh() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORTU_ASUH") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
}

export async function unggahBuktiTransfer(formData: FormData): Promise<HasilAksi> {
  const user = await sesiOrtuAsuh();
  const ortuAsuhId = await ambilOrtuAsuhIdUser(user.id);

  const parsed = unggahBuktiTransferSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return {
      sukses: false,
      pesan: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }
  const input = parsed.data;

  let komitmenId: string | null = null;
  if (input.jadwalBayarId) {
    const jadwal = await ambilJadwalBayarMilikOrtuAsuh(input.jadwalBayarId, user.id);
    if (!jadwal) {
      return { sukses: false, pesan: "Jadwal bayar tidak ditemukan." };
    }
    if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
      return { sukses: false, pesan: "Jadwal ini sudah tidak menerima pembayaran baru." };
    }
    komitmenId = jadwal.komitmenId;
  }

  const file = formData.get("bukti");
  if (!(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "Bukti transfer wajib diunggah." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validasi = validasiBerkas({ mimeType: file.type, ukuranByte: buffer.length });
  if (!validasi.valid) {
    return { sukses: false, pesan: validasi.pesan ?? "Berkas tidak valid." };
  }

  const ekstensi = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const objectKey = `transaksi/${ortuAsuhId}/${randomUUID()}.${ekstensi}`;
  await unggahBerkas(objectKey, buffer, file.type);

  const transaksi = await prisma.$transaction(async (tx) => {
    const dibuat = await tx.transaksi.create({
      data: {
        ortuAsuhId,
        komitmenId,
        jadwalBayarId: input.jadwalBayarId || null,
        nominal: input.nominal,
        metode: input.metode,
        buktiObjectKey: objectKey,
        tglBayar: input.tglBayar,
      },
    });

    await catatAudit(tx, {
      aktorId: user.id,
      aksi: "transaksi.unggah_bukti",
      entitas: "transaksi",
      entitasId: dibuat.id,
      sesudah: { nominal: input.nominal.toString(), metode: input.metode },
    });

    return dibuat;
  });

  revalidatePath("/donatur/pembayaran");
  return { sukses: true, pesan: `Bukti transfer terunggah, menunggu verifikasi admin (ID ${transaksi.id}).` };
}
