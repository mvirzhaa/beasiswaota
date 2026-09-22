import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ambilDaftarBinaanOrtuAsuh } from "./relasi";

// Test integrasi database sungguhan (bukan mock) — menegakkan CLAUDE.md
// aturan keras #10: "mahasiswa binaan saya" ditentukan murni dari
// RelasiAsuh, dan satu donatur tidak boleh melihat binaan donatur lain
// walau tahu ID-nya. Dilewati otomatis kalau DB tidak terjangkau.
const prisma = new PrismaClient();

let dbReady = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReady = true;
} catch {
  dbReady = false;
}

describe.skipIf(!dbReady)("relasi asuh — integrasi database sungguhan", () => {
  const sufiks = randomUUID().slice(0, 8);
  const id = {
    periode: "",
    mahasiswaA: "",
    mahasiswaB: "",
    ortuAsuhA: "",
    ortuAsuhB: "",
    admin: "",
    relasiA: "",
    relasiB: "",
  };

  beforeAll(async () => {
    const periode = await prisma.periode.create({
      data: {
        kode: `TEST-RELASI-${sufiks}`,
        tahunAkademik: "2026/2027",
        semester: 1,
        nominalFull: 5_000_000n,
        tglBuka: new Date("2026-08-01"),
        tglTutup: new Date("2026-09-30"),
        status: "SELEKSI",
      },
    });
    id.periode = periode.id;

    const admin = await prisma.user.create({
      data: { email: `admin-relasi-${sufiks}@uika-bogor.ac.id`, passwordHash: "x", role: "ADMIN", status: "AKTIF" },
    });
    id.admin = admin.id;

    const mahasiswaA = await prisma.mahasiswa.create({
      data: {
        nim: `TESTRELASI-A-${sufiks}`,
        nama: "Mahasiswa A Uji Relasi",
        fakultas: "Fakultas Uji",
        prodi: "Prodi Uji",
        angkatan: 2025,
        semesterBerjalan: 1,
        noHp: "080000001111",
      },
    });
    id.mahasiswaA = mahasiswaA.id;

    const mahasiswaB = await prisma.mahasiswa.create({
      data: {
        nim: `TESTRELASI-B-${sufiks}`,
        nama: "Mahasiswa B Uji Relasi",
        fakultas: "Fakultas Uji",
        prodi: "Prodi Uji",
        angkatan: 2025,
        semesterBerjalan: 1,
        noHp: "080000002222",
      },
    });
    id.mahasiswaB = mahasiswaB.id;

    const ortuAsuhA = await prisma.ortuAsuh.create({
      data: { nama: "Donatur A Uji Relasi", tipe: "INDIVIDU", noHp: "080000003333" },
    });
    id.ortuAsuhA = ortuAsuhA.id;

    const ortuAsuhB = await prisma.ortuAsuh.create({
      data: { nama: "Donatur B Uji Relasi", tipe: "INDIVIDU", noHp: "080000004444" },
    });
    id.ortuAsuhB = ortuAsuhB.id;

    const relasiA = await prisma.relasiAsuh.create({
      data: {
        ortuAsuhId: id.ortuAsuhA,
        mahasiswaId: id.mahasiswaA,
        periodeMulaiId: id.periode,
        tglMulai: new Date(),
        ditugaskanOlehId: id.admin,
      },
    });
    id.relasiA = relasiA.id;

    const relasiB = await prisma.relasiAsuh.create({
      data: {
        ortuAsuhId: id.ortuAsuhB,
        mahasiswaId: id.mahasiswaB,
        periodeMulaiId: id.periode,
        tglMulai: new Date(),
        ditugaskanOlehId: id.admin,
      },
    });
    id.relasiB = relasiB.id;
  });

  afterAll(async () => {
    await prisma.relasiAsuh.deleteMany({ where: { periodeMulaiId: id.periode } });
    await prisma.mahasiswa.deleteMany({ where: { id: { in: [id.mahasiswaA, id.mahasiswaB] } } });
    await prisma.ortuAsuh.deleteMany({ where: { id: { in: [id.ortuAsuhA, id.ortuAsuhB] } } });
    await prisma.user.deleteMany({ where: { id: id.admin } });
    await prisma.periode.deleteMany({ where: { id: id.periode } });
    await prisma.$disconnect();
  });

  it("donatur A tidak melihat mahasiswa binaan donatur B di daftar binaannya", async () => {
    const binaanA = await ambilDaftarBinaanOrtuAsuh(id.ortuAsuhA);
    expect(binaanA.every((b) => b.mahasiswaId !== id.mahasiswaB)).toBe(true);
  });

  it("donatur melihat identitas lengkap binaannya sendiri (tanpa syarat persetujuan lagi)", async () => {
    const binaanA = await ambilDaftarBinaanOrtuAsuh(id.ortuAsuhA);
    expect(binaanA.some((b) => b.mahasiswaId === id.mahasiswaA)).toBe(true);
  });
});
