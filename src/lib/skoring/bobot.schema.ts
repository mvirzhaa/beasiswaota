import { z } from "zod";

/**
 * Kunci baris di tabel Pengaturan yang menyimpan bobot skoring kelayakan.
 * Jangan hardcode bobot di kode — pengelola program harus bisa mengubahnya
 * lewat data tanpa deploy ulang (lihat PROMPT-CLAUDE-CODE.md Sesi 3).
 */
export const KUNCI_PENGATURAN_BOBOT_SKORING = "skoring.bobot";

export const statusOrtuSkoringValues = [
  "LENGKAP",
  "YATIM",
  "PIATU",
  "YATIM_PIATU",
] as const;
export type StatusOrtuSkoring = (typeof statusOrtuSkoringValues)[number];

const kriteriaSkalaSchema = z.object({
  bobot: z.number().min(0).max(100),
  batasBawah: z.number(),
  batasAtas: z.number(),
});

export const bobotSkoringSchema = z.object({
  penghasilan: kriteriaSkalaSchema,
  tanggungan: z.object({
    bobot: z.number().min(0).max(100),
    batasAtas: z.number().positive(),
  }),
  statusOrtu: z.object({
    bobot: z.number().min(0).max(100),
    skor: z.object({
      LENGKAP: z.number().min(0).max(100),
      YATIM: z.number().min(0).max(100),
      PIATU: z.number().min(0).max(100),
      YATIM_PIATU: z.number().min(0).max(100),
    }),
  }),
  ipk: kriteriaSkalaSchema,
  semester: z.object({
    bobot: z.number().min(0).max(100),
    batasAtas: z.number().positive(),
  }),
});

export type BobotSkoring = z.infer<typeof bobotSkoringSchema>;

/**
 * Nilai default dipakai untuk mengisi baris Pengaturan saat seed pertama
 * kali. Sesudah itu, sumber kebenaran adalah tabel, bukan konstanta ini.
 */
export const BOBOT_SKORING_DEFAULT: BobotSkoring = {
  penghasilan: { bobot: 35, batasBawah: 1_000_000, batasAtas: 5_000_000 },
  tanggungan: { bobot: 20, batasAtas: 6 },
  statusOrtu: {
    bobot: 25,
    skor: { LENGKAP: 0, YATIM: 60, PIATU: 60, YATIM_PIATU: 100 },
  },
  ipk: { bobot: 15, batasBawah: 2.0, batasAtas: 4.0 },
  semester: { bobot: 5, batasAtas: 8 },
};

export function totalBobot(bobot: BobotSkoring): number {
  return (
    bobot.penghasilan.bobot +
    bobot.tanggungan.bobot +
    bobot.statusOrtu.bobot +
    bobot.ipk.bobot +
    bobot.semester.bobot
  );
}

/**
 * Total bobot yang tidak sama dengan 100 harus meledak di sini, bukan
 * dinormalisasi diam-diam — skor yang salah tapi terlihat valid lebih
 * berbahaya daripada error yang jelas.
 */
export function validasiBobotSkoring(bobot: BobotSkoring): void {
  const total = totalBobot(bobot);
  if (Math.abs(total - 100) > 0.001) {
    throw new Error(
      `Total bobot skoring harus 100, saat ini ${total}. Perbaiki Pengaturan kunci "${KUNCI_PENGATURAN_BOBOT_SKORING}".`,
    );
  }
}
