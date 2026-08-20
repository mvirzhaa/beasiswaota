import { prisma } from "@/lib/db";
import { laporanPenyaluran } from "@/lib/alokasi/engine";
import { ambilOrtuAsuhIdUser } from "./komitmen";

export const KUNCI_PENGATURAN_NAMA_PENUH = "laporan.tampilkanNamaPenuh";

/** Flag di Pengaturan yang membuka nama penuh mahasiswa di laporan penyaluran donatur. */
export async function ambilFlagNamaPenuh(): Promise<boolean> {
  const baris = await prisma.pengaturan.findUnique({
    where: { kunci: KUNCI_PENGATURAN_NAMA_PENUH },
  });
  if (!baris || typeof baris.nilai !== "object" || baris.nilai === null) {
    return false;
  }
  const nilai = baris.nilai as { aktif?: boolean };
  return nilai.aktif === true;
}

/**
 * Bungkus laporanPenyaluran() (engine.ts, TIDAK diubah) dengan opsi membuka
 * nama penuh via flag Pengaturan. Default engine.ts sudah menyamarkan jadi
 * inisial — kalau flag aktif, nama asli ditimpa di sini, di luar engine.ts.
 */
export async function ambilLaporanPenyaluranOrtuAsuh(userId: string, periodeId?: string) {
  const ortuAsuhId = await ambilOrtuAsuhIdUser(userId);
  const baris = await laporanPenyaluran(prisma, ortuAsuhId, periodeId);

  const tampilkanNamaPenuh = await ambilFlagNamaPenuh();
  if (!tampilkanNamaPenuh || baris.length === 0) {
    return baris;
  }

  const mahasiswaList = await prisma.mahasiswa.findMany({
    where: { id: { in: baris.map((b) => b.mahasiswaId) } },
    select: { id: true, nama: true },
  });
  const petaNama = new Map(mahasiswaList.map((m) => [m.id, m.nama]));

  return baris.map((b) => ({
    ...b,
    namaTampilan: petaNama.get(b.mahasiswaId) ?? b.namaTampilan,
  }));
}
