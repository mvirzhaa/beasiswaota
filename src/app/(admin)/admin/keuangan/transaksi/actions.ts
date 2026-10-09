"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { parseRupiah } from "@/lib/uang";
import { tolakTransaksiSchema } from "@/lib/transaksi/schema";
import { verifikasiTransaksiInti } from "@/server/actions/verifikasi-transaksi-inti";
import { kreditkanTransaksiBaru } from "@/server/actions/kreditkan-transaksi-baru";
import { ambilJadwalBayarUntukTransferManual } from "@/server/queries/transfer-manual";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

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
      ortuAsuh: { select: { nama: true } },
      jadwalBayar: { select: { id: true, periodeId: true } },
    },
  });
  if (!transaksi) {
    return { sukses: false, pesan: "Transaksi tidak ditemukan." };
  }
  if (transaksi.status !== "MENUNGGU_VERIFIKASI") {
    return { sukses: false, pesan: "Transaksi ini tidak dalam status menunggu verifikasi." };
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

  const hasil = await verifikasiTransaksiInti(prisma, {
    transaksiId,
    periodeId,
    nominal: transaksi.nominal,
    jadwalBayarId: transaksi.jadwalBayar?.id ?? null,
    verifiedById: admin.id,
    keterangan: `Transfer terverifikasi dari ${transaksi.ortuAsuh.nama}`,
    aktorAuditId: admin.id,
    aksiAudit: "transaksi.verifikasi",
  });

  if (!hasil.sukses) {
    return {
      sukses: false,
      pesan: "Transaksi ini sudah diproses admin lain sesaat sebelumnya.",
    };
  }

  revalidatePath("/admin/keuangan/transaksi");
  return { sukses: true, pesan: "Transaksi diverifikasi dan tercatat ke ledger." };
}

export async function tolakTransaksi(transaksiId: string, input: unknown): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = tolakTransaksiSchema.safeParse(input);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Alasan wajib diisi." };
  }

  const transaksi = await prisma.transaksi.findUnique({ where: { id: transaksiId } });
  if (!transaksi) {
    return { sukses: false, pesan: "Transaksi tidak ditemukan." };
  }
  if (transaksi.status !== "MENUNGGU_VERIFIKASI") {
    return { sukses: false, pesan: "Transaksi ini tidak dalam status menunggu verifikasi." };
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

  revalidatePath("/admin/keuangan/transaksi");
  return { sukses: true, pesan: "Transaksi ditolak." };
}

// ============================================================================
// Catat transfer manual — kita TIDAK pakai payment gateway (Midtrans/VA),
// semua donasi non-potong-gaji masuk lewat transfer ke rekening resmi yang
// dicantumkan di sistem. Begitu admin mencatat realisasinya di sini,
// transaksi langsung TERVERIFIKASI dan masuk ke "Pemasukan" (sama seperti
// pola input manual potong gaji di /admin/potong-gaji — reuse
// kreditkanTransaksiBaru yang sama, bukan logika verifikasi dua tahap).
// ============================================================================

const catatTransferManualSchema = z.object({
  jadwalBayarId: z.string().min(1, "Pilih donatur & jadwal"),
  nominal: z.string().min(1, "Nominal wajib diisi"),
  tanggal: z.string().min(1, "Tanggal transfer wajib diisi"),
});

export async function catatTransaksiTransferManual(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = catatTransferManualSchema.safeParse(Object.fromEntries(formData.entries()));
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

  const jadwal = await ambilJadwalBayarUntukTransferManual(parsed.data.jadwalBayarId);
  if (!jadwal) {
    return { sukses: false, pesan: "Jadwal bayar tidak ditemukan." };
  }
  if (jadwal.komitmen.mekanisme !== "TRANSFER_MANUAL") {
    return { sukses: false, pesan: "Komitmen ini bukan mekanisme Transfer Manual." };
  }
  if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
    return { sukses: false, pesan: "Jadwal ini sudah tidak menerima pembayaran baru." };
  }

  const hasil = await kreditkanTransaksiBaru(prisma, {
    ortuAsuhId: jadwal.komitmen.ortuAsuhId,
    komitmenId: jadwal.komitmen.id,
    jadwalBayarId: jadwal.id,
    nominal,
    metode: "TRANSFER_MANUAL",
    refEksternal: `transfer-manual-${jadwal.id}`,
    tglBayar: new Date(parsed.data.tanggal),
    periodeId: jadwal.periodeId,
    keterangan: `Transfer manual (dicatat admin) — ${jadwal.komitmen.ortuAsuh.nama}`,
    aktorAuditId: admin.id,
    aksiAudit: "transaksi.input_manual_transfer",
  });

  if (!hasil.sukses) {
    return { sukses: false, pesan: "Jadwal ini sudah pernah dicatat sebelumnya." };
  }

  revalidatePath("/admin/keuangan/transaksi");
  revalidatePath("/admin/keuangan/pemasukan");
  return { sukses: true, pesan: "Transfer berhasil dicatat dan masuk ke Pemasukan." };
}
