import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prosesReminderWaBulanan } from "./proses-reminder-wa";

// Test integrasi database sungguhan untuk cron pengingat WA (Fase 4).
// WA_API_URL/WA_API_TOKEN DIPAKSA kosong di sini, terlepas dari isi .env
// sungguhan — @prisma/client (baris `new PrismaClient()` di bawah) memuat
// .env sebagai efek samping, jadi kalau WA sudah dikonfigurasi di .env
// lokal/VPS, tanpa override ini test akan benar-benar mengirim WA ke
// ChatLoop pakai nomor uji palsu. Yang diuji di sini adalah efek samping
// di database (remindedAt, Notifikasi, idempotensi), bukan pengiriman WA
// sungguhan — itu domain wa.test.ts. Dilewati otomatis kalau DATABASE_URL
// tidak terjangkau.
vi.mock("@/lib/env", async (importOriginal) => {
  const asli = await importOriginal<typeof import("@/lib/env")>();
  return { ...asli, env: { ...asli.env, WA_API_URL: undefined, WA_API_TOKEN: undefined } };
});
const prisma = new PrismaClient();

let dbReady = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReady = true;
} catch {
  dbReady = false;
}

describe.skipIf(!dbReady)("prosesReminderWaBulanan — integrasi database sungguhan", () => {
  const sufiks = randomUUID().slice(0, 8);
  const ortuAsuhIds: string[] = [];
  const komitmenIds: string[] = [];
  const jadwalIds: string[] = [];
  let periodeId = "";

  const tanggalHariIni = new Date().getDate();
  const tanggalBukanHariIni = tanggalHariIni === 1 ? 2 : 1;

  async function buatKomitmenBerulang(kode: string, tanggalPengingat: number) {
    const ortuAsuh = await prisma.ortuAsuh.create({
      data: { nama: `Donatur WA ${kode}`, tipe: "INDIVIDU", noHp: "081200000000" },
    });
    ortuAsuhIds.push(ortuAsuh.id);

    const komitmen = await prisma.komitmen.create({
      data: {
        ortuAsuhId: ortuAsuh.id,
        skema: "PARSIAL",
        nominalPerPeriode: 1_200_000n,
        jumlahPeriode: 8,
        tipe: "BERULANG",
        mekanisme: "TRANSFER_MANUAL",
        ritme: "PER_BULAN",
        tanggalPengingat,
        status: "AKTIF",
        tglMulai: new Date("2026-08-01"),
      },
    });
    komitmenIds.push(komitmen.id);

    const jadwal = await prisma.jadwalBayar.create({
      data: {
        komitmenId: komitmen.id,
        periodeId,
        urutan: 1,
        nominal: 200_000n,
        jatuhTempo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: "BELUM_JATUH_TEMPO",
      },
    });
    jadwalIds.push(jadwal.id);

    return { komitmenId: komitmen.id, jadwalId: jadwal.id, ortuAsuhId: ortuAsuh.id };
  }

  beforeAll(async () => {
    const periode = await prisma.periode.create({
      data: {
        kode: `TEST-WA-${sufiks}`,
        tahunAkademik: "2026/2027",
        semester: 1,
        nominalFull: 1_000_000n,
        tglBuka: new Date("2026-08-01"),
        tglTutup: new Date("2026-09-30"),
        status: "PENYALURAN",
      },
    });
    periodeId = periode.id;
  });

  afterAll(async () => {
    await prisma.jadwalBayar.deleteMany({ where: { id: { in: jadwalIds } } });
    await prisma.komitmen.deleteMany({ where: { id: { in: komitmenIds } } });
    await prisma.notifikasi.deleteMany({ where: { ortuAsuhId: { in: ortuAsuhIds } } });
    await prisma.ortuAsuh.deleteMany({ where: { id: { in: ortuAsuhIds } } });
    await prisma.periode.deleteMany({ where: { id: periodeId } });
    await prisma.$disconnect();
  });

  it("mengingatkan komitmen yang tanggalPengingat-nya hari ini, dan mencatat Notifikasi WA", async () => {
    const target = await buatKomitmenBerulang("cocok", tanggalHariIni);

    const hasil = await prosesReminderWaBulanan(prisma);
    expect(hasil.reminderTerkirim).toBeGreaterThanOrEqual(1);

    const jadwal = await prisma.jadwalBayar.findUnique({ where: { id: target.jadwalId } });
    expect(jadwal?.remindedAt).not.toBeNull();

    const notif = await prisma.notifikasi.findFirst({
      where: { ortuAsuhId: target.ortuAsuhId, kanal: "WA" },
    });
    expect(notif).not.toBeNull();
  });

  it("tidak mengirim ulang di hari yang sama (idempoten lewat remindedAt)", async () => {
    const target = await buatKomitmenBerulang("idempoten", tanggalHariIni);

    await prosesReminderWaBulanan(prisma);
    const jumlahNotifSetelahPertama = await prisma.notifikasi.count({
      where: { ortuAsuhId: target.ortuAsuhId, kanal: "WA" },
    });

    await prosesReminderWaBulanan(prisma);
    const jumlahNotifSetelahKedua = await prisma.notifikasi.count({
      where: { ortuAsuhId: target.ortuAsuhId, kanal: "WA" },
    });

    expect(jumlahNotifSetelahKedua).toBe(jumlahNotifSetelahPertama);
  });

  it("tidak menyentuh komitmen yang tanggalPengingat-nya BUKAN hari ini", async () => {
    const target = await buatKomitmenBerulang("lain-tanggal", tanggalBukanHariIni);

    await prosesReminderWaBulanan(prisma);

    const jadwal = await prisma.jadwalBayar.findUnique({ where: { id: target.jadwalId } });
    expect(jadwal?.remindedAt).toBeNull();
  });
});
