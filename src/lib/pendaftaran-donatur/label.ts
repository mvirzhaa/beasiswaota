import type { SkemaBantuan } from "@prisma/client";

// Form publik cuma menawarkan 2 pilihan (Full Cover / Sharing), tapi enum
// database tetap 3 nilai (lihat schema.ts) — CUSTOM masih mungkin muncul di
// data lama (dibuat sebelum penyederhanaan ini atau lewat form admin
// internal di src/lib/komitmen/schema.ts), jadi tetap dilabeli di sini.
const LABEL_SKEMA: Record<SkemaBantuan, string> = {
  FULL: "Full Cover",
  PARSIAL: "Sharing",
  CUSTOM: "Kolektif (Legacy)",
};

export function labelSkema(skema: SkemaBantuan): string {
  return LABEL_SKEMA[skema];
}
