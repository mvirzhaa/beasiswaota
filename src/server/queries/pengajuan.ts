import { prisma } from "@/lib/db";
import type { UserSesi } from "@/lib/rbac-core";

/**
 * Periode yang sedang menerima pendaftaran. Tidak ada scoping user karena
 * ini data publik dalam konteks sesi (semua mahasiswa lihat periode yang
 * sama), tapi tetap hanya dipanggil dari halaman yang sudah di-guard role.
 */
export async function ambilPeriodePendaftaranAktif() {
  return prisma.periode.findFirst({
    where: { status: "PENDAFTARAN" },
    orderBy: { tglBuka: "desc" },
  });
}

/**
 * Pengajuan milik mahasiswa yang sedang login, untuk periode tertentu.
 * Scoping kepemilikan ada DI QUERY (where mahasiswa.userId), bukan
 * difilter setelah fetch — supaya IDOR mustahil lewat jalur ini.
 */
export async function ambilPengajuanMahasiswa(userId: string, periodeId: string) {
  const mahasiswaId = await mahasiswaIdDariUser(userId);
  return prisma.pengajuan.findUnique({
    where: { mahasiswaId_periodeId: { mahasiswaId, periodeId } },
    include: { berkas: true },
  });
}

async function mahasiswaIdDariUser(userId: string): Promise<string> {
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!mahasiswa) {
    throw new Error("Profil mahasiswa tidak ditemukan untuk user ini");
  }
  return mahasiswa.id;
}

export async function ambilMahasiswaIdUser(userId: string): Promise<string> {
  return mahasiswaIdDariUser(userId);
}

/** Daftar pengajuan untuk panel admin, dengan filter opsional. */
export async function ambilDaftarPengajuanAdmin(filter: {
  periodeId?: string;
  status?:
    | "DRAFT"
    | "DIAJUKAN"
    | "VERIFIKASI_BERKAS"
    | "DISETUJUI"
    | "DITOLAK"
    | "DIBATALKAN";
}) {
  return prisma.pengajuan.findMany({
    where: {
      ...(filter.periodeId ? { periodeId: filter.periodeId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    },
    include: {
      mahasiswa: { select: { nama: true, nim: true, fakultas: true, prodi: true } },
      periode: { select: { kode: true } },
      berkas: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Pengajuan yang layak dihitung ulang skornya untuk satu periode: hanya
 * yang masih bisa diputuskan (DIAJUKAN / VERIFIKASI_BERKAS), lengkap dengan
 * data akademik mahasiswa yang dibutuhkan hitungSkor().
 */
export async function ambilPengajuanUntukSkoring(periodeId: string) {
  return prisma.pengajuan.findMany({
    where: {
      periodeId,
      status: { in: ["DIAJUKAN", "VERIFIKASI_BERKAS"] },
    },
    select: {
      id: true,
      penghasilanOrtu: true,
      jmlTanggungan: true,
      statusOrtu: true,
      skor: true,
      mahasiswa: { select: { ipk: true, semesterBerjalan: true } },
    },
  });
}

export async function ambilPengajuanDetailAdmin(id: string) {
  return prisma.pengajuan.findUnique({
    where: { id },
    include: {
      mahasiswa: true,
      periode: true,
      berkas: true,
    },
  });
}

export interface AksesBerkas {
  berkas: {
    id: string;
    objectKey: string;
    namaAsli: string;
    mimeType: string;
  };
}

/**
 * Titik IDOR paling rawan (lihat CLAUDE.md aturan keras #7): tentukan
 * apakah `user` boleh mengakses berkas ini. Meloloskan ADMIN dan pemilik
 * berkas (mahasiswa yang pengajuannya memuat berkas ini), menolak semua
 * user lain — termasuk mahasiswa lain yang tahu ID berkasnya.
 */
export async function cekAksesBerkas(
  berkasId: string,
  user: UserSesi,
): Promise<AksesBerkas | null> {
  const berkas = await prisma.pengajuanBerkas.findUnique({
    where: { id: berkasId },
    select: {
      id: true,
      objectKey: true,
      namaAsli: true,
      mimeType: true,
      pengajuan: {
        select: { mahasiswa: { select: { userId: true } } },
      },
    },
  });

  if (!berkas) return null;

  const pemilik = user.role === "ADMIN" || berkas.pengajuan.mahasiswa.userId === user.id;
  if (!pemilik) return null;

  return {
    berkas: {
      id: berkas.id,
      objectKey: berkas.objectKey,
      namaAsli: berkas.namaAsli,
      mimeType: berkas.mimeType,
    },
  };
}
