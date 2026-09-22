import type { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";
import { formatRupiah } from "@/lib/uang";
import { kirimWa } from "@/lib/notifikasi/wa";
import { pesanWaReminderKomitmenBulanan } from "@/lib/notifikasi/template-wa";

function tanggalSama(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export interface HasilProsesReminderWa {
  reminderTerkirim: number;
}

/**
 * Dipanggil dari POST /api/cron/reminder-wa. Untuk tiap Komitmen AKTIF
 * bertipe BERULANG yang Komitmen.tanggalPengingat-nya sama dengan tanggal
 * hari ini (dipilih donatur sendiri saat mendaftar — lihat form pendaftaran
 * donatur v2), cari JadwalBayar terdekat yang belum lunas dan kirim
 * pengingat WA. Idempoten per-hari lewat JadwalBayar.remindedAt — field
 * yang sama dipakai reminder email H-7/H-1 di proses-reminder-jadwal.ts,
 * jadi kalau jadwal yang sama sudah diingatkan hari ini lewat jalur
 * manapun, tidak dikirim ulang dari sini.
 */
export async function prosesReminderWaBulanan(db: PrismaClient): Promise<HasilProsesReminderWa> {
  const sekarang = new Date();
  const tanggalHariIni = sekarang.getDate();

  const komitmenJatuhTempo = await db.komitmen.findMany({
    where: { status: "AKTIF", tipe: "BERULANG", tanggalPengingat: tanggalHariIni },
    include: {
      ortuAsuh: {
        select: { id: true, nama: true, atasNamaMunfiq: true, noHp: true, kodeAkses: true },
      },
      jadwalBayar: {
        where: { status: { in: ["BELUM_JATUH_TEMPO", "JATUH_TEMPO", "TERLAMBAT"] } },
        orderBy: { jatuhTempo: "asc" },
        take: 1,
      },
    },
  });

  let reminderTerkirim = 0;
  for (const komitmen of komitmenJatuhTempo) {
    const jadwal = komitmen.jadwalBayar[0];
    if (!jadwal) continue;
    if (jadwal.remindedAt && tanggalSama(jadwal.remindedAt, sekarang)) continue;

    const ortuAsuh = komitmen.ortuAsuh;
    const namaDonatur = ortuAsuh.atasNamaMunfiq || ortuAsuh.nama;
    const url = `${env.APP_URL}/laporan/${ortuAsuh.kodeAkses}`;

    await db.$transaction(async (tx) => {
      await tx.jadwalBayar.update({ where: { id: jadwal.id }, data: { remindedAt: sekarang } });
      await tx.notifikasi.create({
        data: {
          ortuAsuhId: ortuAsuh.id,
          kanal: "WA",
          judul: "Pengingat pembayaran komitmen bulanan",
          isi: `Komitmen Anda sebesar ${formatRupiah(jadwal.nominal)} jatuh tempo ${jadwal.jatuhTempo.toLocaleDateString("id-ID")}.`,
          tautan: `/laporan/${ortuAsuh.kodeAkses}`,
        },
      });
    });

    await kirimWa(
      ortuAsuh.noHp,
      pesanWaReminderKomitmenBulanan({
        namaDonatur,
        nominal: jadwal.nominal,
        jatuhTempo: jadwal.jatuhTempo,
        url,
      }),
    );
    reminderTerkirim += 1;
  }

  return { reminderTerkirim };
}
