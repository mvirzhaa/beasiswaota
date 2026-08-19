export const MIME_DIIZINKAN = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const UKURAN_MAKS_BYTE = 5 * 1024 * 1024; // 5MB

export interface HasilValidasiBerkas {
  valid: boolean;
  pesan?: string;
}

/**
 * Fungsi murni: cek MIME type dan ukuran berkas pengajuan. Dipanggil di
 * server SEBELUM upload ke MinIO — jangan percaya validasi client saja.
 */
export function validasiBerkas(input: {
  mimeType: string;
  ukuranByte: number;
}): HasilValidasiBerkas {
  if (!MIME_DIIZINKAN.includes(input.mimeType as (typeof MIME_DIIZINKAN)[number])) {
    return {
      valid: false,
      pesan: "Format berkas harus PDF, JPG, atau PNG.",
    };
  }

  if (input.ukuranByte <= 0) {
    return { valid: false, pesan: "Berkas kosong." };
  }

  if (input.ukuranByte > UKURAN_MAKS_BYTE) {
    return { valid: false, pesan: "Ukuran berkas maksimal 5MB." };
  }

  return { valid: true };
}
