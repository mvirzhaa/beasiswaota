import { prisma } from "@/lib/db";
import type { PengaturanLanding } from "@/lib/pengaturan-landing/schema";

export const KUNCI_PENGATURAN_LANDING = "landing";

// Salinan persis teks yang dulu hardcoded di src/app/page.tsx — dipakai
// sebagai fallback kalau admin belum pernah menyimpan lewat /admin/pengaturan,
// supaya landing page tidak pernah pecah/kosong.
export const DEFAULT_PENGATURAN_LANDING: PengaturanLanding = {
  hero: {
    judul: "Menjembatani Asa, Mewujudkan Sarjana",
    deskripsi:
      "Program Beasiswa Orangtua Asuh UIKA Bogor menghimpun kedermawanan para donatur untuk membantu biaya Uang Kuliah Tunggal (UKT) mahasiswa berprestasi dan dhuafa, memastikan tidak ada generasi bangsa yang terhenti studinya.",
  },
  pilar: [
    {
      judul: "Dana Terpadu (Pooling)",
      deskripsi:
        "Dana dari seluruh donatur dihimpun dalam satu pool per semester untuk menjamin pemerataan bantuan tanpa diskriminasi.",
    },
    {
      judul: "Skoring Objektif",
      deskripsi:
        "Mesin alokasi menilai status yatim/piatu, penghasilan orang tua, tanggungan, dan IPK secara matematis dan transparan.",
    },
    {
      judul: "Monitoring Akademik",
      deskripsi:
        "Perkembangan IPK dan laporan studi mahasiswa dipantau berkala sebagai syarat keberlanjutan beasiswa tiap semester.",
    },
    {
      judul: "Akuntabilitas Transparan",
      deskripsi:
        "Setiap rupiah tercatat dalam ledger keuangan terverifikasi dan dapat dipantau laporannya langsung oleh para donatur.",
    },
  ],
  pimpinan: {
    pesan:
      "Program Beasiswa Orangtua Asuh adalah wujud nyata kepedulian sivitas akademika dan para munfiq untuk memastikan tidak ada mahasiswa berprestasi dan dhuafa di UIKA yang terhenti cita-citanya karena keterbatasan finansial. Mari bersama menanam benih amal jariyah yang tak terputus.",
  },
  rekening: {
    bank: "Bank Syariah Indonesia (BSI)",
    nomor: "7367215121",
    atasNama: "Orang Tua Asuh UIKA Bogor",
  },
  kontak: [
    { nama: "Nurseha Marasabessy, S.H.", nomor: "0813-8315-5797" },
    { nama: "Siti Nuraziyah, S.Ak.", nomor: "0818-0714-6988" },
  ],
  gambar: {},
};

/**
 * Setiap seksi (hero/pilar/pimpinan/rekening/kontak/gambar) disimpan admin
 * secara independen (lihat admin/pengaturan/actions.ts) supaya simpan satu
 * form tidak menimpa form lain — makanya di sini di-merge per-seksi di atas
 * default, bukan trust penuh ke JSON tersimpan (yang mungkin cuma berisi
 * sebagian seksi).
 */
export async function ambilPengaturanLanding(): Promise<PengaturanLanding> {
  const baris = await prisma.pengaturan.findUnique({ where: { kunci: KUNCI_PENGATURAN_LANDING } });
  if (!baris) return DEFAULT_PENGATURAN_LANDING;

  const tersimpan = baris.nilai as Partial<PengaturanLanding>;
  return {
    hero: tersimpan.hero ?? DEFAULT_PENGATURAN_LANDING.hero,
    pilar: tersimpan.pilar ?? DEFAULT_PENGATURAN_LANDING.pilar,
    pimpinan: tersimpan.pimpinan ?? DEFAULT_PENGATURAN_LANDING.pimpinan,
    rekening: tersimpan.rekening ?? DEFAULT_PENGATURAN_LANDING.rekening,
    kontak: tersimpan.kontak ?? DEFAULT_PENGATURAN_LANDING.kontak,
    gambar: { ...DEFAULT_PENGATURAN_LANDING.gambar, ...tersimpan.gambar },
  };
}
