import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prosesNotifikasiLaporanSemester } from "./proses-laporan-semester";

// Test integrasi database sungguhan untuk notifikasi laporan akhir semester
// (Fase 5). RESEND_API_KEY/WA_API_URL tidak diisi di lingkungan test, jadi
// kirimEmail()/kirimWa() no-op — yang diuji adalah efek sampingnya di
// database (Notifikasi dibuat, flag Pengaturan idempoten). Dilewati otomatis
// kalau DATABASE_URL tidak terjangkau.
const prisma = new PrismaClient();

let dbReady = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReady = true;
} catch {
  dbReady = false;
}

describe.skipIf(!dbReady)("prosesNotifikasiLaporanSemester — integrasi database sungguhan", () => {
  const sufiks = randomUUID().slice(0, 8);
  let periodeId = "";
  let ortuAsuhId = "";
  let kodeAkses = "";
  let transaksiId = "";

  beforeAll(async () => {
    const periode = await prisma.periode.create({
      data: {
        kode: `TEST-SEMESTER-${sufiks}`,
        tahunAkademik: "2026/2027",
        semester: 1,
        nominalFull: 1_000_000n,
        tglBuka: new Date("2026-02-01"),
        tglTutup: new Date("2026-04-01"),
        status: "SELESAI",
      },
    });
    periodeId = periode.id;

    const ortuAsuh = await prisma.ortuAsuh.create({
      data: { nama: "Donatur Uji Semester", tipe: "INDIVIDU", noHp: "081300000000" },
    });
    ortuAsuhId = ortuAsuh.id;
    kodeAkses = ortuAsuh.kodeAkses;

    const transaksi = await prisma.transaksi.create({
      data: {
        ortuAsuhId: ortuAsuh.id,
        nominal: 1_000_000n,
        metode: "TRANSFER_MANUAL",
        status: "TERVERIFIKASI",
        tglBayar: new Date("2026-02-05"),
      },
    });
    transaksiId = transaksi.id;

    await prisma.danaLedger.create({
      data: {
        periodeId,
        tipe: "KREDIT",
        nominal: 1_000_000n,
        saldoSetelah: 1_000_000n,
        transaksiId: transaksi.id,
        keterangan: "Fixture test laporan semester",
      },
    });
  });

  afterAll(async () => {
    await prisma.pengaturan.deleteMany({ where: { kunci: `laporan_semester_terkirim:${periodeId}` } });
    await prisma.notifikasi.deleteMany({ where: { ortuAsuhId } });
    await prisma.danaLedger.deleteMany({ where: { periodeId } });
    await prisma.transaksi.deleteMany({ where: { id: transaksiId } });
    await prisma.ortuAsuh.deleteMany({ where: { id: ortuAsuhId } });
    await prisma.periode.deleteMany({ where: { id: periodeId } });
    await prisma.$disconnect();
  });

  it("mengirim notifikasi ke donatur yang berkontribusi di periode yang baru SELESAI", async () => {
    const hasil = await prosesNotifikasiLaporanSemester(prisma);

    expect(hasil.periodeDiproses).toBeGreaterThanOrEqual(1);
    expect(hasil.notifikasiTerkirim).toBeGreaterThanOrEqual(1);

    const notif = await prisma.notifikasi.findFirst({
      where: { ortuAsuhId, kanal: "EMAIL" },
    });
    expect(notif).not.toBeNull();
    expect(notif?.tautan).toContain(kodeAkses);

    const flag = await prisma.pengaturan.findUnique({
      where: { kunci: `laporan_semester_terkirim:${periodeId}` },
    });
    expect(flag).not.toBeNull();
  });

  it("tidak mengirim ulang untuk periode yang sudah diproses (idempoten lewat Pengaturan)", async () => {
    const jumlahSebelum = await prisma.notifikasi.count({ where: { ortuAsuhId, kanal: "EMAIL" } });

    const hasilKedua = await prosesNotifikasiLaporanSemester(prisma);
    expect(hasilKedua.periodeDiproses).toBe(0);

    const jumlahSesudah = await prisma.notifikasi.count({ where: { ortuAsuhId, kanal: "EMAIL" } });
    expect(jumlahSesudah).toBe(jumlahSebelum);
  });
});
