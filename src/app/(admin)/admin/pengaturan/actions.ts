"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { KUNCI_PENGATURAN_NAMA_PENUH } from "@/server/queries/laporan";
import { KUNCI_PENGATURAN_LANDING, ambilPengaturanLanding } from "@/server/queries/pengaturan-landing";
import {
  heroLandingSchema,
  daftarPilarLandingSchema,
  pimpinanLandingSchema,
  rekeningLandingSchema,
  daftarKontakLandingSchema,
  JENIS_GAMBAR_LANDING,
  type PengaturanLanding,
  type JenisGambarLanding,
} from "@/lib/pengaturan-landing/schema";
import { unggahAsetPublik, urlAsetPublik } from "@/lib/storage/minio-publik";
import type { HasilAksi } from "@/types/aksi";

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

// Setiap seksi landing disimpan independen (lihat komentar di
// server/queries/pengaturan-landing.ts) — baca nilai lengkap saat ini
// (sudah di-merge dengan default), timpa satu seksi, simpan lagi utuh.
async function simpanSeksiLanding(seksi: Partial<PengaturanLanding>): Promise<void> {
  const saatIni = await ambilPengaturanLanding();
  const baru: PengaturanLanding = { ...saatIni, ...seksi };

  await prisma.pengaturan.upsert({
    where: { kunci: KUNCI_PENGATURAN_LANDING },
    update: { nilai: baru },
    create: { kunci: KUNCI_PENGATURAN_LANDING, nilai: baru },
  });

  revalidatePath("/admin/pengaturan");
  revalidatePath("/");
}

export async function setFlagNamaPenuh(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const aktif = formData.get("aktif") === "on";

  await prisma.pengaturan.upsert({
    where: { kunci: KUNCI_PENGATURAN_NAMA_PENUH },
    update: { nilai: { aktif } },
    create: { kunci: KUNCI_PENGATURAN_NAMA_PENUH, nilai: { aktif } },
  });

  revalidatePath("/admin/pengaturan");
  return {
    sukses: true,
    pesan: aktif
      ? "Nama penuh mahasiswa sekarang ditampilkan di laporan penyaluran donatur."
      : "Laporan penyaluran donatur kembali disamarkan jadi inisial.",
  };
}

// ============================================================================
// CMS Landing Page — teks. Struktur/JSX landing page tidak berubah, hanya
// sumber datanya (lihat src/app/page.tsx).
// ============================================================================

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function simpanHeroLanding(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const parsed = heroLandingSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await simpanSeksiLanding({ hero: parsed.data });
  return { sukses: true, pesan: "Konten Hero berhasil disimpan." };
}

export async function simpanPilarLanding(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const obj = formToObject(formData);
  const pilar = [0, 1, 2, 3].map((i) => ({
    judul: obj[`judul${i}`] ?? "",
    deskripsi: obj[`deskripsi${i}`] ?? "",
  }));

  const parsed = daftarPilarLandingSchema.safeParse(pilar);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await simpanSeksiLanding({ pilar: parsed.data });
  return { sukses: true, pesan: "4 Pilar berhasil disimpan." };
}

export async function simpanPimpinanLanding(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const parsed = pimpinanLandingSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await simpanSeksiLanding({ pimpinan: parsed.data });
  return { sukses: true, pesan: "Pesan pimpinan berhasil disimpan." };
}

export async function simpanRekeningLanding(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const parsed = rekeningLandingSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await simpanSeksiLanding({ rekening: parsed.data });
  return { sukses: true, pesan: "Rekening donasi berhasil disimpan." };
}

export async function simpanKontakLanding(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const obj = formToObject(formData);
  const kontak = [0, 1].map((i) => ({
    nama: obj[`nama${i}`] ?? "",
    nomor: obj[`nomor${i}`] ?? "",
  }));

  const parsed = daftarKontakLandingSchema.safeParse(kontak);
  if (!parsed.success) {
    return { sukses: false, pesan: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await simpanSeksiLanding({ kontak: parsed.data });
  return { sukses: true, pesan: "Kontak WA berhasil disimpan." };
}

// ============================================================================
// CMS Landing Page — gambar. Bucket publik terpisah dari berkas pengajuan
// (lihat src/lib/storage/minio-publik.ts).
// ============================================================================

const MIME_GAMBAR_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"];
const UKURAN_GAMBAR_MAKS_BYTE = 5 * 1024 * 1024; // 5MB

export async function unggahGambarLanding(formData: FormData): Promise<HasilAksi> {
  await sesiAdmin();

  const jenis = formData.get("jenis");
  const file = formData.get("file");

  if (typeof jenis !== "string" || !JENIS_GAMBAR_LANDING.includes(jenis as JenisGambarLanding)) {
    return { sukses: false, pesan: "Jenis gambar tidak dikenali." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { sukses: false, pesan: "Berkas gambar wajib diunggah." };
  }
  if (!MIME_GAMBAR_DIIZINKAN.includes(file.type)) {
    return { sukses: false, pesan: "Format gambar harus JPG, PNG, atau WEBP." };
  }
  if (file.size > UKURAN_GAMBAR_MAKS_BYTE) {
    return { sukses: false, pesan: "Ukuran gambar maksimal 5MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ekstensi = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  // objectKey pakai nama jenis (bukan UUID) SENGAJA — supaya unggah ulang
  // gambar yang sama otomatis mengganti file lama, tidak menumpuk sampah.
  const objectKey = `landing/${jenis}.${ekstensi}`;
  await unggahAsetPublik(objectKey, buffer, file.type);

  // gambar adalah objek dengan beberapa kunci opsional — timpa hanya kunci
  // `jenis` ini, jangan sampai unggah 1 foto menghapus URL foto lain yang
  // sudah tersimpan.
  const saatIni = await ambilPengaturanLanding();
  await simpanSeksiLanding({
    gambar: { ...saatIni.gambar, [jenis as JenisGambarLanding]: urlAsetPublik(objectKey) },
  });

  return { sukses: true, pesan: "Gambar berhasil diunggah." };
}
