import type { PrismaClient } from "@prisma/client";
import { catatAudit } from "@/lib/audit";
import { kirimEmail } from "@/lib/notifikasi/email";
import { templateReminderJadwalBayar, templateKomitmenMenunggak } from "@/lib/notifikasi/template";

const HARI_MENUNGGAK = 30;

function tanggalSama(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function selisihHari(dari: Date, ke: Date): number {
  const msPerHari = 1000 * 60 * 60 * 24;
  return Math.floor((ke.getTime() - dari.getTime()) / msPerHari);
}

export interface HasilProsesReminder {
  statusDiperbarui: number;
  reminderTerkirim: number;
  komitmenMenunggak: number;
}

/**
 * Dipanggil dari POST /api/cron/reminder. Tiga hal dalam satu jalan:
 * 1. Kebersihan status JadwalBayar (BELUM_JATUH_TEMPO -> JATUH_TEMPO -> TERLAMBAT).
 * 2. Reminder H-7 dan H-1, idempoten lewat remindedAt (dicek per-hari, bukan sekali
 *    selamanya, supaya H-7 dan H-1 tetap bisa terkirim terpisah).
 * 3. Komitmen lewat jatuh tempo >30 hari otomatis MENUNGGAK + notifikasi admin
 *    (CLAUDE.md: mahasiswa penerima TIDAK kehilangan status penerima karena ini —
 *    fungsi ini sengaja TIDAK menyentuh Pengajuan/Tagihan/Alokasi sama sekali).
 */
export async function prosesReminderJadwalBayar(db: PrismaClient): Promise<HasilProsesReminder> {
  const sekarang = new Date();

  const jatuhTempoHariIni = await db.jadwalBayar.updateMany({
    where: { status: "BELUM_JATUH_TEMPO", jatuhTempo: { lte: sekarang } },
    data: { status: "JATUH_TEMPO" },
  });
  const terlambat = await db.jadwalBayar.updateMany({
    where: { status: { in: ["BELUM_JATUH_TEMPO", "JATUH_TEMPO"] }, jatuhTempo: { lt: sekarang } },
    data: { status: "TERLAMBAT" },
  });
  const statusDiperbarui = jatuhTempoHariIni.count + terlambat.count;

  const kandidatReminder = await db.jadwalBayar.findMany({
    where: { status: { in: ["BELUM_JATUH_TEMPO", "JATUH_TEMPO", "TERLAMBAT"] } },
    include: {
      periode: { select: { kode: true } },
      komitmen: {
        select: { ortuAsuh: { select: { userId: true, nama: true, atasNamaMunfiq: true } } },
      },
    },
  });

  let reminderTerkirim = 0;
  for (const jadwal of kandidatReminder) {
    const hariMenuju = selisihHari(sekarang, jadwal.jatuhTempo);
    if (hariMenuju !== 7 && hariMenuju !== 1) continue;
    if (jadwal.remindedAt && tanggalSama(jadwal.remindedAt, sekarang)) continue;

    await db.$transaction(async (tx) => {
      await tx.jadwalBayar.update({ where: { id: jadwal.id }, data: { remindedAt: sekarang } });
      await tx.notifikasi.create({
        data: {
          userId: jadwal.komitmen.ortuAsuh.userId,
          kanal: "INAPP",
          judul: `Pengingat jatuh tempo H-${hariMenuju}`,
          isi: `Komitmen Anda untuk periode ${jadwal.periode.kode} jatuh tempo dalam ${hariMenuju} hari.`,
          tautan: "/donatur/pembayaran",
        },
      });
    });

    const pengguna = await db.user.findUnique({
      where: { id: jadwal.komitmen.ortuAsuh.userId },
      select: { email: true },
    });
    if (pengguna) {
      await kirimEmail(
        pengguna.email,
        templateReminderJadwalBayar({
          namaDonatur: jadwal.komitmen.ortuAsuh.atasNamaMunfiq || jadwal.komitmen.ortuAsuh.nama,
          periodeKode: jadwal.periode.kode,
          nominal: jadwal.nominal,
          jatuhTempo: jadwal.jatuhTempo,
          hariMenuju,
        }),
      );
    }
    reminderTerkirim += 1;
  }

  const komitmenAktif = await db.komitmen.findMany({
    where: { status: "AKTIF" },
    include: {
      ortuAsuh: { select: { nama: true, atasNamaMunfiq: true } },
      jadwalBayar: { where: { status: "TERLAMBAT" }, orderBy: { jatuhTempo: "asc" }, take: 1 },
    },
  });

  const adminAktif = await db.user.findMany({
    where: { role: "ADMIN", status: "AKTIF" },
    select: { id: true, email: true },
  });

  let komitmenMenunggak = 0;
  for (const komitmen of komitmenAktif) {
    const terlambatTertua = komitmen.jadwalBayar[0];
    if (!terlambatTertua) continue;

    const hariTerlambat = selisihHari(terlambatTertua.jatuhTempo, sekarang);
    if (hariTerlambat <= HARI_MENUNGGAK) continue;

    const namaDonatur = komitmen.ortuAsuh.atasNamaMunfiq || komitmen.ortuAsuh.nama;

    await db.$transaction(async (tx) => {
      await tx.komitmen.update({ where: { id: komitmen.id }, data: { status: "MENUNGGAK" } });
      await catatAudit(tx, {
        aktorId: null,
        aksi: "komitmen.otomatis_menunggak",
        entitas: "komitmen",
        entitasId: komitmen.id,
        sebelum: { status: "AKTIF" },
        sesudah: { status: "MENUNGGAK", hariTerlambat },
      });
      for (const admin of adminAktif) {
        await tx.notifikasi.create({
          data: {
            userId: admin.id,
            kanal: "INAPP",
            judul: "Komitmen menunggak",
            isi: `Komitmen donatur ${namaDonatur} menunggak lebih dari ${HARI_MENUNGGAK} hari. Mahasiswa penerima tidak kehilangan status penerima — kekurangan ditutup dari pool.`,
            tautan: "/admin/komitmen?status=MENUNGGAK",
          },
        });
      }
    });

    for (const admin of adminAktif) {
      await kirimEmail(
        admin.email,
        templateKomitmenMenunggak({ namaAdmin: "Admin", namaDonatur, hariTerlambat }),
      );
    }
    komitmenMenunggak += 1;
  }

  return { statusDiperbarui, reminderTerkirim, komitmenMenunggak };
}
