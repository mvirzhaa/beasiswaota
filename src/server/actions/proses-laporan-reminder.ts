import type { PrismaClient } from "@prisma/client";
import { hitungBatasKirimLaporan } from "@/lib/monitoring/batas-laporan";
import { kirimEmail } from "@/lib/notifikasi/email";
import { templateLaporanReminder } from "@/lib/notifikasi/template";

const HARI_SEBELUM_BATAS = 7;

function selisihHari(dari: Date, ke: Date): number {
  return Math.floor((ke.getTime() - dari.getTime()) / (1000 * 60 * 60 * 24));
}

export interface HasilProsesLaporanReminder {
  reminderTerkirim: number;
}

/**
 * Dipanggil dari POST /api/cron/laporan-reminder. LaporanPerkembangan
 * tidak punya kolom remindedAt sendiri (schema final) — idempotensi
 * dicek lewat ada/tidaknya Notifikasi dengan judul yang sama untuk user
 * itu yang dibuat HARI INI, bukan lewat flag khusus.
 */
export async function prosesLaporanReminder(db: PrismaClient): Promise<HasilProsesLaporanReminder> {
  const sekarang = new Date();
  const awalHariIni = new Date(sekarang.toISOString().slice(0, 10));

  const periodeList = await db.periode.findMany({ where: { status: { not: "DRAFT" } } });
  const periodeCocok = periodeList.filter(
    (p) => selisihHari(sekarang, hitungBatasKirimLaporan(p)) === HARI_SEBELUM_BATAS,
  );

  let reminderTerkirim = 0;

  for (const periode of periodeCocok) {
    const batasKirim = hitungBatasKirimLaporan(periode);

    const penerima = await db.pengajuan.findMany({
      where: { periodeId: periode.id, status: "DISETUJUI" },
      select: { mahasiswa: { select: { id: true, nama: true, userId: true } } },
    });

    for (const p of penerima) {
      const laporan = await db.laporanPerkembangan.findUnique({
        where: { mahasiswaId_periodeId: { mahasiswaId: p.mahasiswa.id, periodeId: periode.id } },
        select: { status: true },
      });
      if (laporan?.status === "DIKIRIM" || laporan?.status === "DIVERIFIKASI") continue;

      const judul = `Pengingat laporan perkembangan periode ${periode.kode}`;
      const sudahDiingatkanHariIni = await db.notifikasi.findFirst({
        where: { userId: p.mahasiswa.userId, judul, createdAt: { gte: awalHariIni } },
      });
      if (sudahDiingatkanHariIni) continue;

      await db.notifikasi.create({
        data: {
          userId: p.mahasiswa.userId,
          kanal: "INAPP",
          judul,
          isi: `Laporan perkembangan periode ${periode.kode} belum dikirim. Batas kirim ${batasKirim.toLocaleDateString("id-ID")}. Ini syarat perpanjangan beasiswa.`,
          tautan: "/mahasiswa/laporan",
        },
      });

      const pengguna = await db.user.findUnique({
        where: { id: p.mahasiswa.userId },
        select: { email: true },
      });
      if (pengguna) {
        await kirimEmail(
          pengguna.email,
          templateLaporanReminder({ namaMahasiswa: p.mahasiswa.nama, periodeKode: periode.kode, batasKirim }),
        );
      }
      reminderTerkirim += 1;
    }
  }

  return { reminderTerkirim };
}
