export interface BarisRealisasiMentah {
  jadwalBayarId: unknown;
  nip: unknown;
  nominal: unknown;
  tanggal: unknown;
}

export interface BarisRealisasiValid {
  baris: number;
  jadwalBayarId: string;
  nip: string;
  nominal: bigint;
  tanggal: Date;
}

export interface BarisRealisasiError {
  baris: number;
  pesan: string;
}

export interface HasilParseRealisasi {
  valid: BarisRealisasiValid[];
  error: BarisRealisasiError[];
}

function keTeksTrim(nilai: unknown): string {
  return typeof nilai === "string" ? nilai.trim() : String(nilai ?? "").trim();
}

/**
 * Fungsi murni: validasi format baris realisasi potong gaji. TIDAK
 * mengecek kecocokan NIP ke database (itu perlu query, dilakukan
 * pemanggil) — di sini hanya memastikan bentuk datanya benar.
 */
export function parseBarisRealisasiPotongGaji(
  barisMentah: { baris: number; data: BarisRealisasiMentah }[],
): HasilParseRealisasi {
  const valid: BarisRealisasiValid[] = [];
  const error: BarisRealisasiError[] = [];

  for (const { baris, data } of barisMentah) {
    const jadwalBayarId = keTeksTrim(data.jadwalBayarId);
    if (!jadwalBayarId) {
      error.push({ baris, pesan: "JadwalBayarId kosong" });
      continue;
    }

    const nip = keTeksTrim(data.nip);
    if (!nip) {
      error.push({ baris, pesan: "NIP kosong" });
      continue;
    }

    const nominalMentah = data.nominal;
    const nominalAngka =
      typeof nominalMentah === "number" ? nominalMentah : Number(String(nominalMentah ?? "").replace(/[.,]/g, ""));
    if (!Number.isFinite(nominalAngka) || nominalAngka <= 0) {
      error.push({ baris, pesan: `Nominal tidak valid: "${String(nominalMentah)}"` });
      continue;
    }

    const tanggalMentah = data.tanggal;
    const tanggal = tanggalMentah instanceof Date ? tanggalMentah : new Date(String(tanggalMentah ?? ""));
    if (Number.isNaN(tanggal.getTime())) {
      error.push({ baris, pesan: `Tanggal realisasi tidak valid: "${String(tanggalMentah)}"` });
      continue;
    }

    valid.push({
      baris,
      jadwalBayarId,
      nip,
      nominal: BigInt(Math.trunc(nominalAngka)),
      tanggal,
    });
  }

  return { valid, error };
}
