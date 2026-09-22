import { z } from "zod";

// Skema form pendaftaran donatur v2 — menggantikan Google Form lama.
// Validasi cabang (Perorangan/Lembaga, Internal/Eksternal, dst) sengaja
// dijaga longgar di sini (banyak field optional) lalu ditegakkan lewat
// pemeriksaan silang di server action (lihat actions.ts), mengikuti pola
// yang sama dipakai buatKomitmenSchema untuk skema donasi.

export const kategoriDonaturSchema = z.enum(["PERORANGAN", "LEMBAGA"]);
export const skemaBantuanSchema = z.enum(["FULL", "PARSIAL", "CUSTOM"]);
export const tipeKomitmenSchema = z.enum(["SEKALI", "BERULANG"]);
export const mekanismePendaftaranSchema = z.enum([
  "TRANSFER_MANUAL",
  "POTONG_GAJI",
]);
export const targetPenyaluranSchema = z.enum(["SATU_MAHASISWA", "SEMUA_PENERIMA"]);

export const pendaftaranDonaturSchema = z.object({
  kategori: kategoriDonaturSchema,
  // Hanya relevan & wajib untuk kategori PERORANGAN.
  internal: z.enum(["true", "false"]).optional(),

  nama: z.string().min(1, "Nama wajib diisi"),
  // Checklist "Atas Nama" / "Paguyuban" — paling banyak satu yang aktif.
  atasNama: z.enum(["true", "false"]).optional(),
  namaAtasNama: z.string().optional(),
  paguyuban: z.enum(["true", "false"]).optional(),
  namaPaguyuban: z.string().optional(),

  // Opsional — WA (noHp) adalah kanal utama, email cuma pelengkap.
  email: z.email("Email tidak valid").optional().or(z.literal("")),
  noHp: z.string().min(8, "Nomor WhatsApp tidak valid"),
  // Wajib untuk Perorangan-Eksternal & Lembaga, divalidasi di server action.
  alamat: z.string().optional(),

  nominal: z.string().min(1, "Nominal wajib diisi"),
  tipeKomitmen: tipeKomitmenSchema,
  mekanisme: mekanismePendaftaranSchema,

  // Sebagian (menutup gap) / Full Cover / Kolektif — semuanya memakai nilai
  // `nominal` yang sama di atas, ini hanya menentukan CARA dana dipakai.
  skema: skemaBantuanSchema,

  targetPenyaluran: targetPenyaluranSchema,
  targetMahasiswaId: z.string().optional(),

  // Wajib diisi (1-31) kalau tipeKomitmen === BERULANG.
  tanggalPengingat: z.coerce.number().int().min(1).max(31).optional(),
});

export type PendaftaranDonaturInput = z.infer<typeof pendaftaranDonaturSchema>;
