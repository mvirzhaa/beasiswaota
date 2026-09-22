"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseRupiah } from "@/lib/uang";
import { parseBarisRealisasiPotongGaji } from "@/lib/potong-gaji/xlsx-parse";
import { bacaBarisXlsxRealisasi } from "@/lib/potong-gaji/xlsx-io";
import { ambilJadwalBayarUntukPotonganGaji } from "@/server/queries/potong-gaji";
import { kreditkanTransaksiBaru } from "@/server/actions/kreditkan-transaksi-baru";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

// nominal disimpan sebagai string (bukan bigint) di tipe ini KHUSUS supaya
// bisa lewat JSON.stringify di komponen klien (field tersembunyi form
// konfirmasi) — bigint tidak bisa di-JSON.stringify. Dikembalikan ke bigint
// lagi saat commit.
export interface BarisPratinjauRealisasi {
  baris: number;
  jadwalBayarId: string;
  nip: string;
  nominal: string;
  tanggal: string;
  namaDonatur: string | null;
  periodeId: string | null;
  valid: boolean;
  pesanError?: string;
}

export interface HasilPratinjauPotonganGaji {
  sukses: boolean;
  pesan: string;
  baris?: BarisPratinjauRealisasi[];
}

export async function pratinjauImporPotonganGaji(formData: FormData): Promise<HasilPratinjauPotonganGaji> {
  await sesiAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "File XLSX wajib diunggah." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const barisMentah = await bacaBarisXlsxRealisasi(buffer);
  const { valid, error } = parseBarisRealisasiPotongGaji(barisMentah);

  const hasilPratinjau: BarisPratinjauRealisasi[] = [];

  for (const b of valid) {
    const dasar = {
      baris: b.baris,
      jadwalBayarId: b.jadwalBayarId,
      nip: b.nip,
      nominal: b.nominal.toString(),
      tanggal: b.tanggal.toISOString(),
    };

    const jadwal = await ambilJadwalBayarUntukPotonganGaji(b.jadwalBayarId);
    if (!jadwal) {
      hasilPratinjau.push({ ...dasar, namaDonatur: null, periodeId: null, valid: false, pesanError: "JadwalBayarId tidak ditemukan" });
      continue;
    }
    if (jadwal.komitmen.mekanisme !== "POTONG_GAJI") {
      hasilPratinjau.push({
        ...dasar,
        namaDonatur: jadwal.komitmen.ortuAsuh.nama,
        periodeId: jadwal.periodeId,
        valid: false,
        pesanError: "Komitmen ini bukan mekanisme POTONG_GAJI",
      });
      continue;
    }
    if (jadwal.komitmen.ortuAsuh.nip !== b.nip) {
      hasilPratinjau.push({
        ...dasar,
        namaDonatur: jadwal.komitmen.ortuAsuh.nama,
        periodeId: jadwal.periodeId,
        valid: false,
        pesanError: `NIP tidak cocok (terdaftar: ${jadwal.komitmen.ortuAsuh.nip ?? "-"})`,
      });
      continue;
    }
    if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
      hasilPratinjau.push({
        ...dasar,
        namaDonatur: jadwal.komitmen.ortuAsuh.nama,
        periodeId: jadwal.periodeId,
        valid: false,
        pesanError: "Jadwal ini sudah tidak menerima pembayaran baru",
      });
      continue;
    }

    hasilPratinjau.push({
      ...dasar,
      namaDonatur: jadwal.komitmen.ortuAsuh.nama,
      periodeId: jadwal.periodeId,
      valid: true,
    });
  }

  const jumlahError = error.length + hasilPratinjau.filter((b) => !b.valid).length;

  return {
    sukses: true,
    pesan: `${hasilPratinjau.filter((b) => b.valid).length} baris siap disimpan, ${jumlahError} baris bermasalah.`,
    baris: hasilPratinjau,
  };
}

export async function komitImporPotonganGaji(nomorBatch: string, dataJson: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  if (!nomorBatch.trim()) {
    return { sukses: false, pesan: "Nomor batch wajib diisi." };
  }

  let barisKlien: BarisPratinjauRealisasi[];
  try {
    barisKlien = JSON.parse(dataJson);
  } catch {
    return { sukses: false, pesan: "Data pratinjau tidak valid, ulangi dari unggah file." };
  }

  let berhasil = 0;
  const gagal: string[] = [];

  for (const b of barisKlien.filter((x) => x.valid)) {
    // Re-validasi PENUH di sini terhadap DB saat ini — jangan percaya baris
    // dari klien, keadaan JadwalBayar/NIP bisa saja berubah sejak pratinjau.
    const jadwal = await ambilJadwalBayarUntukPotonganGaji(b.jadwalBayarId);
    if (!jadwal || jadwal.komitmen.mekanisme !== "POTONG_GAJI" || jadwal.komitmen.ortuAsuh.nip !== b.nip) {
      gagal.push(`Baris ${b.baris}: data tidak lagi valid, ulangi dari unggah file.`);
      continue;
    }
    if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
      gagal.push(`Baris ${b.baris}: jadwal sudah tidak menerima pembayaran baru.`);
      continue;
    }

    const refEksternal = `potong-gaji-${nomorBatch}-${b.jadwalBayarId}`;
    const hasil = await kreditkanTransaksiBaru(prisma, {
      ortuAsuhId: jadwal.komitmen.ortuAsuhId,
      komitmenId: jadwal.komitmen.id,
      jadwalBayarId: b.jadwalBayarId,
      nominal: BigInt(b.nominal),
      metode: "POTONG_GAJI",
      refEksternal,
      tglBayar: new Date(b.tanggal),
      periodeId: jadwal.periodeId,
      keterangan: `Potong gaji batch ${nomorBatch} — ${jadwal.komitmen.ortuAsuh.nama}`,
      aktorAuditId: admin.id,
      aksiAudit: "transaksi.impor_potong_gaji",
    });

    if (hasil.sukses) {
      berhasil += 1;
    } else {
      gagal.push(`Baris ${b.baris}: sudah pernah diimpor sebelumnya (nomor batch + jadwal ini duplikat).`);
    }
  }

  revalidatePath("/admin/potong-gaji");
  return {
    sukses: berhasil > 0,
    pesan: `${berhasil} baris berhasil dicatat.${gagal.length > 0 ? " Gagal: " + gagal.join("; ") : ""}`,
  };
}

// ============================================================================
// Input manual — satu baris realisasi tanpa lewat Excel, untuk kasus
// pengecualian/susulan. Reuse validasi & kreditkanTransaksiBaru yang sama
// persis dipakai jalur impor di atas, bukan logika baru.
// ============================================================================

const inputManualSchema = z.object({
  jadwalBayarId: z.string().min(1, "Pilih jadwal potongan gaji"),
  nominal: z.string().min(1, "Nominal wajib diisi"),
  tanggal: z.string().min(1, "Tanggal realisasi wajib diisi"),
});

export async function catatPotonganGajiManual(formData: FormData): Promise<HasilAksi> {
  const admin = await sesiAdmin();

  const parsed = inputManualSchema.safeParse(Object.fromEntries(formData.entries()));
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

  const jadwal = await ambilJadwalBayarUntukPotonganGaji(parsed.data.jadwalBayarId);
  if (!jadwal) {
    return { sukses: false, pesan: "Jadwal potongan gaji tidak ditemukan." };
  }
  if (jadwal.komitmen.mekanisme !== "POTONG_GAJI") {
    return { sukses: false, pesan: "Komitmen ini bukan mekanisme POTONG_GAJI." };
  }
  if (jadwal.status === "TERBAYAR" || jadwal.status === "DIBATALKAN") {
    return { sukses: false, pesan: "Jadwal ini sudah tidak menerima pembayaran baru." };
  }

  const hasil = await kreditkanTransaksiBaru(prisma, {
    ortuAsuhId: jadwal.komitmen.ortuAsuhId,
    komitmenId: jadwal.komitmen.id,
    jadwalBayarId: jadwal.id,
    nominal,
    metode: "POTONG_GAJI",
    refEksternal: `potong-gaji-manual-${jadwal.id}`,
    tglBayar: new Date(parsed.data.tanggal),
    periodeId: jadwal.periodeId,
    keterangan: `Potong gaji (input manual) — ${jadwal.komitmen.ortuAsuh.nama}`,
    aktorAuditId: admin.id,
    aksiAudit: "transaksi.input_manual_potong_gaji",
  });

  if (!hasil.sukses) {
    return { sukses: false, pesan: "Jadwal ini sudah pernah dicatat sebelumnya." };
  }

  revalidatePath("/admin/potong-gaji");
  return { sukses: true, pesan: "Potongan gaji berhasil dicatat." };
}
