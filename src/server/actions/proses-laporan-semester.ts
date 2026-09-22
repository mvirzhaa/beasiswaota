import type { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";
import { kirimEmail } from "@/lib/notifikasi/email";
import { kirimWa } from "@/lib/notifikasi/wa";
import { templateLaporanSemesterSiap } from "@/lib/notifikasi/template";
import { pesanWaLaporanSemesterSiap } from "@/lib/notifikasi/template-wa";

function kunciPengaturan(periodeId: string): string {
  return `laporan_semester_terkirim:${periodeId}`;
}

export interface HasilProsesLaporanSemester {
  periodeDiproses: number;
  notifikasiTerkirim: number;
}

/**
 * Dipanggil dari POST /api/cron/laporan-semester. Setiap periode yang
 * sudah SELESAI (dikunci admin — biasanya sekitar April/Oktober sesuai
 * kalender akademik, tapi pemicunya status Periode, bukan bulan kalender)
 * dan belum pernah diproses, dikirimi notifikasi (email + WA) ke semua
 * donatur yang berkontribusi di periode itu, berisi tautan ke halaman
 * publik /laporan/{kodeAkses} yang SUDAH ADA (bukan generate PDF baru —
 * lihat catatan di rencana Fase 5).
 *
 * Idempoten lewat tabel Pengaturan (kunci per periode) supaya timer harian
 * yang terpicu berkali-kali tidak mengirim notifikasi dobel.
 */
export async function prosesNotifikasiLaporanSemester(
  db: PrismaClient,
): Promise<HasilProsesLaporanSemester> {
  const periodeSelesai = await db.periode.findMany({ where: { status: "SELESAI" } });

  let periodeDiproses = 0;
  let notifikasiTerkirim = 0;

  for (const periode of periodeSelesai) {
    const sudahDiproses = await db.pengaturan.findUnique({
      where: { kunci: kunciPengaturan(periode.id) },
    });
    if (sudahDiproses) continue;

    interface DonaturKontributor {
      id: string;
      nama: string;
      atasNamaMunfiq: string | null;
      noHp: string;
      email: string | null;
      kodeAkses: string;
    }

    const kredit = await db.danaLedger.findMany({
      where: { periodeId: periode.id, tipe: "KREDIT", transaksiId: { not: null } },
      include: {
        transaksi: {
          select: {
            ortuAsuh: {
              select: {
                id: true,
                nama: true,
                atasNamaMunfiq: true,
                noHp: true,
                email: true,
                kodeAkses: true,
              },
            },
          },
        },
      },
    });

    const donaturUnik = new Map<string, DonaturKontributor>();
    for (const baris of kredit) {
      const ortuAsuh = baris.transaksi?.ortuAsuh;
      if (ortuAsuh) donaturUnik.set(ortuAsuh.id, ortuAsuh);
    }

    for (const donatur of donaturUnik.values()) {
      const namaDonatur = donatur.atasNamaMunfiq || donatur.nama;
      const url = `${env.APP_URL}/laporan/${donatur.kodeAkses}`;

      await db.notifikasi.create({
        data: {
          ortuAsuhId: donatur.id,
          kanal: "EMAIL",
          judul: `Laporan penyaluran periode ${periode.kode} sudah tersedia`,
          isi: `Laporan penyaluran dana Anda untuk periode ${periode.kode} sudah tersedia di ${url}.`,
          tautan: `/laporan/${donatur.kodeAkses}`,
        },
      });

      if (donatur.email) {
        await kirimEmail(
          donatur.email,
          templateLaporanSemesterSiap({ namaDonatur, periodeKode: periode.kode, url }),
        );
      }
      await kirimWa(
        donatur.noHp,
        pesanWaLaporanSemesterSiap({ namaDonatur, periodeKode: periode.kode, url }),
      );

      notifikasiTerkirim += 1;
    }

    await db.pengaturan.create({
      data: { kunci: kunciPengaturan(periode.id), nilai: { terkirim: true, pada: new Date().toISOString() } },
    });
    periodeDiproses += 1;
  }

  return { periodeDiproses, notifikasiTerkirim };
}
