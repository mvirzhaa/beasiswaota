import { prisma } from "@/lib/db";
import {
  bobotSkoringSchema,
  validasiBobotSkoring,
  KUNCI_PENGATURAN_BOBOT_SKORING,
  type BobotSkoring,
} from "@/lib/skoring/bobot.schema";

/**
 * Bobot skoring TIDAK boleh hardcode (lihat CLAUDE.md & PROMPT-CLAUDE-CODE.md
 * Sesi 3) — selalu dibaca dari Pengaturan. Baris hilang atau bentuknya tidak
 * valid harus meledak di sini, bukan diam-diam jatuh ke default.
 */
export async function ambilBobotSkoring(): Promise<BobotSkoring> {
  const baris = await prisma.pengaturan.findUnique({
    where: { kunci: KUNCI_PENGATURAN_BOBOT_SKORING },
  });

  if (!baris) {
    throw new Error(
      `Pengaturan "${KUNCI_PENGATURAN_BOBOT_SKORING}" belum ada. Jalankan seed atau isi lewat admin.`,
    );
  }

  const bobot = bobotSkoringSchema.parse(baris.nilai);
  validasiBobotSkoring(bobot);
  return bobot;
}
