import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { jalankanAlokasi } from "./engine";

// Test integrasi database sungguhan (bukan mock) — satu-satunya cara
// membuktikan advisory lock benar-benar menyerialkan dua eksekusi konkuren
// di Postgres. Dilewati otomatis kalau DATABASE_URL tidak terjangkau (mis.
// Docker belum jalan), supaya `vitest run` tetap hijau di lingkungan tanpa DB.
const prisma = new PrismaClient();

let dbReady = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReady = true;
} catch {
  dbReady = false;
}

describe.skipIf(!dbReady)("jalankanAlokasi — integrasi database sungguhan", () => {
  const sufiks = randomUUID().slice(0, 8);
  const ids = {
    periode: "",
    mahasiswa: "",
    userMahasiswa: "",
    tagihan: "",
    ortuAsuh: "",
    userOrtuAsuh: "",
    userAdmin: "",
    transaksi: "",
  };

  const NOMINAL_TAGIHAN = 5_000_000n;

  beforeAll(async () => {
    const periode = await prisma.periode.create({
      data: {
        kode: `TEST-6-${sufiks}`,
        tahunAkademik: "2026/2027",
        semester: 1,
        nominalFull: NOMINAL_TAGIHAN,
        tglBuka: new Date("2026-08-01"),
        tglTutup: new Date("2026-09-30"),
        status: "SELEKSI",
      },
    });
    ids.periode = periode.id;

    const userMahasiswa = await prisma.user.create({
      data: {
        email: `mhs-test-6-${sufiks}@uika-bogor.ac.id`,
        passwordHash: "x",
        role: "MAHASISWA",
        status: "AKTIF",
      },
    });
    ids.userMahasiswa = userMahasiswa.id;

    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        userId: userMahasiswa.id,
        nim: `TEST6-${sufiks}`,
        nama: "Mahasiswa Uji Konkurensi",
        fakultas: "Fakultas Uji",
        prodi: "Prodi Uji",
        angkatan: 2025,
        semesterBerjalan: 1,
        noHp: "080000000000",
      },
    });
    ids.mahasiswa = mahasiswa.id;

    const tagihan = await prisma.tagihan.create({
      data: {
        mahasiswaId: mahasiswa.id,
        periodeId: periode.id,
        komponen: "UKT",
        nominal: NOMINAL_TAGIHAN,
        terbayar: 0n,
        jatuhTempo: new Date("2026-09-01"),
        status: "BELUM_LUNAS",
      },
    });
    ids.tagihan = tagihan.id;

    const userOrtuAsuh = await prisma.user.create({
      data: {
        email: `ortu-test-6-${sufiks}@example.com`,
        passwordHash: "x",
        role: "ORTU_ASUH",
        status: "AKTIF",
      },
    });
    ids.userOrtuAsuh = userOrtuAsuh.id;

    const ortuAsuh = await prisma.ortuAsuh.create({
      data: {
        userId: userOrtuAsuh.id,
        nama: "Donatur Uji Konkurensi",
        tipe: "INDIVIDU",
        noHp: "080000000001",
        noHpAlternatif: "080000000002",
      },
    });
    ids.ortuAsuh = ortuAsuh.id;

    const transaksi = await prisma.transaksi.create({
      data: {
        ortuAsuhId: ortuAsuh.id,
        nominal: NOMINAL_TAGIHAN,
        metode: "TRANSFER_MANUAL",
        status: "TERVERIFIKASI",
        tglBayar: new Date("2026-08-05"),
      },
    });
    ids.transaksi = transaksi.id;

    await prisma.danaLedger.create({
      data: {
        periodeId: periode.id,
        tipe: "KREDIT",
        nominal: NOMINAL_TAGIHAN,
        saldoSetelah: NOMINAL_TAGIHAN,
        transaksiId: transaksi.id,
        keterangan: "Fixture test integrasi konkurensi",
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: `admin-test-6-${sufiks}@uika-bogor.ac.id`,
        passwordHash: "x",
        role: "ADMIN",
        status: "AKTIF",
      },
    });
    ids.userAdmin = admin.id;
  });

  afterAll(async () => {
    await prisma.alokasiSumber.deleteMany({ where: { transaksiId: ids.transaksi } });
    await prisma.alokasi.deleteMany({ where: { periodeId: ids.periode } });
    await prisma.danaLedger.deleteMany({ where: { periodeId: ids.periode } });
    await prisma.transaksi.deleteMany({ where: { id: ids.transaksi } });
    await prisma.tagihan.deleteMany({ where: { id: ids.tagihan } });
    await prisma.mahasiswa.deleteMany({ where: { id: ids.mahasiswa } });
    await prisma.ortuAsuh.deleteMany({ where: { id: ids.ortuAsuh } });
    await prisma.user.deleteMany({
      where: { id: { in: [ids.userMahasiswa, ids.userOrtuAsuh, ids.userAdmin] } },
    });
    await prisma.periode.deleteMany({ where: { id: ids.periode } });
    await prisma.$disconnect();
  });

  it("dua eksekusi konkuren pada pool yang hanya cukup untuk satu penerima tidak double-spend", async () => {
    const [hasil1, hasil2] = await Promise.all([
      jalankanAlokasi(prisma, {
        periodeId: ids.periode,
        dryRun: false,
        dibuatOlehId: ids.userAdmin,
      }),
      jalankanAlokasi(prisma, {
        periodeId: ids.periode,
        dryRun: false,
        dibuatOlehId: ids.userAdmin,
      }),
    ]);

    const batchIds = [hasil1.batchId, hasil2.batchId].filter((b): b is string => b !== null);
    // Advisory lock menyerialkan kedua eksekusi: yang kedua jalan setelah
    // yang pertama commit, melihat pool sudah habis, dan tidak membuat batch.
    expect(batchIds).toHaveLength(1);

    const totalSumber = await prisma.alokasiSumber.aggregate({
      where: { transaksiId: ids.transaksi },
      _sum: { nominal: true },
    });
    expect(totalSumber._sum.nominal ?? 0n).toBe(NOMINAL_TAGIHAN);

    const jumlahAlokasi = await prisma.alokasi.count({ where: { periodeId: ids.periode } });
    expect(jumlahAlokasi).toBe(1);
  });
});
