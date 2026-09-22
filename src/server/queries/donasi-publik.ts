import { prisma } from "@/lib/db";

export interface KandidatEarmarkPublik {
  mahasiswaId: string;
  kodeAnonim: string;
  fakultas: string;
  prodi: string;
  angkatan: number;
}

/**
 * Daftar kandidat penerima untuk dropdown "donasi ke 1 mahasiswa tertentu"
 * di form pendaftaran donatur PUBLIK (belum login). Identitas mahasiswa
 * (nama, NIM) SENGAJA tidak pernah dikirim ke sini — ini halaman publik,
 * jadi jauh lebih ketat dari RelasiAsuh yang sudah punya persetujuan
 * mahasiswa (aturan keras #11). Donatur hanya melihat kode anonim +
 * fakultas/prodi/angkatan untuk menentukan pilihan.
 */
export async function ambilKandidatEarmarkPublik(): Promise<KandidatEarmarkPublik[]> {
  const mahasiswa = await prisma.mahasiswa.findMany({
    where: { statusAkademik: "AKTIF" },
    select: { id: true, fakultas: true, prodi: true, angkatan: true },
    orderBy: { id: "asc" },
  });

  return mahasiswa.map((m, index) => ({
    mahasiswaId: m.id,
    kodeAnonim: `Penerima #${String(index + 1).padStart(2, "0")}`,
    fakultas: m.fakultas,
    prodi: m.prodi,
    angkatan: m.angkatan,
  }));
}

/** Validasi server-side: pastikan id yang dikirim client memang mahasiswa aktif. */
export async function targetMahasiswaValid(mahasiswaId: string): Promise<boolean> {
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id: mahasiswaId },
    select: { statusAkademik: true },
  });
  return mahasiswa?.statusAkademik === "AKTIF";
}
