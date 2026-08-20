import { prisma } from "@/lib/db";
import { ambilMahasiswaIdUser } from "./pengajuan";

/** Tagihan milik mahasiswa yang sedang login — scoping kepemilikan DI QUERY. */
export async function ambilTagihanMahasiswa(userId: string) {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);
  return prisma.tagihan.findMany({
    where: { mahasiswaId },
    include: { periode: { select: { kode: true } } },
    orderBy: { createdAt: "desc" },
  });
}

function namaDonaturTampilan(ortuAsuh: {
  anonim: boolean;
  atasNamaMunfiq: string | null;
  nama: string;
}): string {
  if (ortuAsuh.anonim) return "Hamba Allah";
  return ortuAsuh.atasNamaMunfiq || ortuAsuh.nama;
}

export interface BarisRiwayatBantuan {
  id: string;
  periodeKode: string;
  nominal: bigint;
  tglSalur: Date | null;
  namaDonaturTampilan: string;
}

/**
 * Riwayat bantuan yang diterima mahasiswa. Hanya bagian dana yang sudah
 * DISETUJUI/DISALURKAN yang ditampilkan (DRAFT belum final). Hanya field
 * nama/atasNamaMunfiq/anonim donatur yang di-select — TIDAK PERNAH noHp/
 * alamat (aturan keras #12 soal batas kontak, meski arahnya ke ORTU_ASUH,
 * tetap praktik aman untuk tidak pernah memilih kolom kontak di luar
 * kebutuhan tampilan).
 */
export async function ambilRiwayatBantuanMahasiswa(userId: string): Promise<BarisRiwayatBantuan[]> {
  const mahasiswaId = await ambilMahasiswaIdUser(userId);

  const sumber = await prisma.alokasiSumber.findMany({
    where: {
      alokasi: {
        tagihan: { mahasiswaId },
        status: { in: ["DISETUJUI", "DISALURKAN"] },
      },
    },
    include: {
      alokasi: {
        select: {
          tglSalur: true,
          periode: { select: { kode: true } },
        },
      },
      transaksi: {
        select: {
          ortuAsuh: { select: { nama: true, atasNamaMunfiq: true, anonim: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return sumber.map((s) => ({
    id: s.id,
    periodeKode: s.alokasi.periode.kode,
    nominal: s.nominal,
    tglSalur: s.alokasi.tglSalur,
    namaDonaturTampilan: namaDonaturTampilan(s.transaksi.ortuAsuh),
  }));
}
