"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { hitungSaldo } from "@/lib/keuangan/ledger";
import { tolakTransaksiSchema } from "@/lib/transaksi/schema";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

const SUDAH_DIPROSES = "SUDAH_DIPROSES";

/**
 * Ini sesi yang menyentuh uang — lihat CLAUDE.md aturan keras 1, 3, 6, 8, 9.
 * Advisory lock per periode, update bersyarat status untuk mencegah double
 * credit, dan verifikator wajib beda dari pengunggah bukti.
 */
export async function verifikasiTransaksi(
  transaksiId: string,
  periodeIdInput?: unknown,
): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const transaksi = await prisma.transaksi.findUnique({
    where: { id: transaksiId },
    include: {
      ortuAsuh: { select: { userId: true, nama: true } },
      jadwalBayar: { select: { id: true, periodeId: true } },
    },
  });
  if (!transaksi) {
    return { sukses: false, pesan: "Transaksi tidak ditemukan." };
  }
  if (transaksi.status !== "MENUNGGU_VERIFIKASI") {
    return { sukses: false, pesan: "Transaksi ini tidak dalam status menunggu verifikasi." };
  }
  if (transaksi.ortuAsuh.userId === admin.id) {
    return {
      sukses: false,
      pesan: "Verifikator tidak boleh sama dengan pengunggah bukti transfer.",
    };
  }

  let periodeId: string;
  if (transaksi.jadwalBayar) {
    periodeId = transaksi.jadwalBayar.periodeId;
  } else {
    if (typeof periodeIdInput !== "string" || periodeIdInput.length === 0) {
      return {
        sukses: false,
        pesan: "Transaksi ini tidak terkait jadwal — pilih periode tujuan dana secara manual.",
      };
    }
    const periode = await prisma.periode.findUnique({ where: { id: periodeIdInput } });
    if (!periode) {
      return { sukses: false, pesan: "Periode tujuan tidak ditemukan." };
    }
    if (periode.status === "SELESAI") {
      return { sukses: false, pesan: "Periode ini sudah terkunci, tidak bisa menerima dana baru." };
    }
    periodeId = periode.id;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(4711, hashtext(${periodeId}))`;

      try {
        await tx.transaksi.update({
          where: { id: transaksiId, status: "MENUNGGU_VERIFIKASI" },
          data: { status: "TERVERIFIKASI", verifiedById: admin.id, verifiedAt: new Date() },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          throw new Error(SUDAH_DIPROSES);
        }
        throw error;
      }

      const saldoSebelum = await hitungSaldo(tx, periodeId);
      const saldoSetelah = saldoSebelum + transaksi.nominal;

      await tx.danaLedger.create({
        data: {
          periodeId,
          tipe: "KREDIT",
          nominal: transaksi.nominal,
          saldoSetelah,
          transaksiId: transaksi.id,
          keterangan: `Transfer terverifikasi dari ${transaksi.ortuAsuh.nama}`,
        },
      });

      if (transaksi.jadwalBayar) {
        await tx.jadwalBayar.update({
          where: { id: transaksi.jadwalBayar.id },
          data: { status: "TERBAYAR" },
        });
      }

      await catatAudit(tx, {
        aktorId: admin.id,
        aksi: "transaksi.verifikasi",
        entitas: "transaksi",
        entitasId: transaksiId,
        sebelum: { status: "MENUNGGU_VERIFIKASI" },
        sesudah: { status: "TERVERIFIKASI", saldoSetelah: saldoSetelah.toString() },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === SUDAH_DIPROSES) {
      return {
        sukses: false,
        pesan: "Transaksi ini sudah diproses admin lain sesaat sebelumnya.",
      };
    }
    throw error;
  }

  revalidatePath("/admin/transaksi");
  revalidatePath("/donatur/pembayaran");
  return { sukses: true, pesan: "Transaksi diverifikasi dan tercatat ke ledger." };
}

export async function tolakTransaksi(transaksiId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = tolakTransaksiSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Alasan wajib diisi." };
  }

  const transaksi = await prisma.transaksi.findUnique({
    where: { id: transaksiId },
    include: { ortuAsuh: { select: { userId: true } } },
  });
  if (!transaksi) {
    return { sukses: false, pesan: "Transaksi tidak ditemukan." };
  }
  if (transaksi.status !== "MENUNGGU_VERIFIKASI") {
    return { sukses: false, pesan: "Transaksi ini tidak dalam status menunggu verifikasi." };
  }
  if (transaksi.ortuAsuh.userId === admin.id) {
    return {
      sukses: false,
      pesan: "Verifikator tidak boleh sama dengan pengunggah bukti transfer.",
    };
  }

  const hasil = await prisma.$transaction(async (tx) => {
    const diperbarui = await tx.transaksi.updateMany({
      where: { id: transaksiId, status: "MENUNGGU_VERIFIKASI" },
      data: {
        status: "DITOLAK",
        catatanTolak: parsed.data.catatan,
        verifiedById: admin.id,
        verifiedAt: new Date(),
      },
    });
    if (diperbarui.count === 0) {
      return false;
    }

    await catatAudit(tx, {
      aktorId: admin.id,
      aksi: "transaksi.tolak",
      entitas: "transaksi",
      entitasId: transaksiId,
      sebelum: { status: "MENUNGGU_VERIFIKASI" },
      sesudah: { status: "DITOLAK", catatan: parsed.data.catatan },
    });
    return true;
  });

  if (!hasil) {
    return { sukses: false, pesan: "Transaksi ini sudah diproses admin lain sesaat sebelumnya." };
  }

  revalidatePath("/admin/transaksi");
  revalidatePath("/donatur/pembayaran");
  return { sukses: true, pesan: "Transaksi ditolak." };
}
