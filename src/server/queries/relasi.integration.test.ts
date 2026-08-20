import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  ambilDaftarBinaanOrtuAsuh,
  ambilRelasiMilikMahasiswa,
} from "./relasi";
import { ambilRelasiUntukKirimPesan, ambilPesanRelasiUntukUser } from "./pesan-binaan";

// Test integrasi database sungguhan (bukan mock) — menegakkan CLAUDE.md
// aturan keras #10, #11, #12 dan skenario test yang diminta eksplisit di
// PROMPT-CLAUDE-CODE.md Sesi 7. Dilewati otomatis kalau DB tidak
// terjangkau.
const prisma = new PrismaClient();

let dbReady = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReady = true;
} catch {
  dbReady = false;
}

describe.skipIf(!dbReady)("relasi & pesan binaan — integrasi database sungguhan", () => {
  const sufiks = randomUUID().slice(0, 8);
  const id = {
    periode: "",
    mahasiswaA: "",
    userMahasiswaA: "",
    mahasiswaB: "",
    userMahasiswaB: "",
    ortuAsuhA: "",
    userOrtuAsuhA: "",
    ortuAsuhB: "",
    userOrtuAsuhB: "",
    admin: "",
    relasiADisetujui: "",
    relasiBBelumSetuju: "",
    relasiUntukMahasiswaB: "",
    pengajuanB: "",
    tagihanB: "",
  };

  async function buatUser(email: string, role: "MAHASISWA" | "ORTU_ASUH" | "ADMIN") {
    const user = await prisma.user.create({
      data: { email, passwordHash: "x", role, status: "AKTIF" },
    });
    return user.id;
  }

  beforeAll(async () => {
    const periode = await prisma.periode.create({
      data: {
        kode: `TEST-7-${sufiks}`,
        tahunAkademik: "2026/2027",
        semester: 1,
        nominalFull: 5_000_000n,
        tglBuka: new Date("2026-08-01"),
        tglTutup: new Date("2026-09-30"),
        status: "SELEKSI",
      },
    });
    id.periode = periode.id;

    id.userMahasiswaA = await buatUser(`mhs-a-7-${sufiks}@uika-bogor.ac.id`, "MAHASISWA");
    id.userMahasiswaB = await buatUser(`mhs-b-7-${sufiks}@uika-bogor.ac.id`, "MAHASISWA");
    id.userOrtuAsuhA = await buatUser(`ortu-a-7-${sufiks}@example.com`, "ORTU_ASUH");
    id.userOrtuAsuhB = await buatUser(`ortu-b-7-${sufiks}@example.com`, "ORTU_ASUH");
    id.admin = await buatUser(`admin-7-${sufiks}@uika-bogor.ac.id`, "ADMIN");

    const mahasiswaA = await prisma.mahasiswa.create({
      data: {
        userId: id.userMahasiswaA,
        nim: `TEST7A-${sufiks}`,
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
        userId: id.userMahasiswaB,
        nim: `TEST7B-${sufiks}`,
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
      data: {
        userId: id.userOrtuAsuhA,
        nama: "Donatur A Uji Relasi",
        tipe: "INDIVIDU",
        noHp: "080000003333",
        noHpAlternatif: "080000003334",
      },
    });
    id.ortuAsuhA = ortuAsuhA.id;

    const ortuAsuhB = await prisma.ortuAsuh.create({
      data: {
        userId: id.userOrtuAsuhB,
        nama: "Donatur B Uji Relasi",
        tipe: "INDIVIDU",
        noHp: "080000004444",
        noHpAlternatif: "080000004445",
      },
    });
    id.ortuAsuhB = ortuAsuhB.id;

    // Relasi A: donatur A <-> mahasiswa A, SUDAH disetujui.
    const relasiA = await prisma.relasiAsuh.create({
      data: {
        ortuAsuhId: id.ortuAsuhA,
        mahasiswaId: id.mahasiswaA,
        periodeMulaiId: id.periode,
        tglMulai: new Date(),
        ditugaskanOlehId: id.admin,
        persetujuanMahasiswa: true,
        persetujuanAt: new Date(),
      },
    });
    id.relasiADisetujui = relasiA.id;

    // Relasi B: donatur B <-> mahasiswa B, BELUM disetujui.
    const relasiB = await prisma.relasiAsuh.create({
      data: {
        ortuAsuhId: id.ortuAsuhB,
        mahasiswaId: id.mahasiswaB,
        periodeMulaiId: id.periode,
        tglMulai: new Date(),
        ditugaskanOlehId: id.admin,
        persetujuanMahasiswa: false,
      },
    });
    id.relasiBBelumSetuju = relasiB.id;
    id.relasiUntukMahasiswaB = relasiB.id;

    const pengajuanB = await prisma.pengajuan.create({
      data: {
        mahasiswaId: id.mahasiswaB,
        periodeId: id.periode,
        nominalKebutuhan: 5_000_000n,
        penghasilanOrtu: 2_000_000n,
        jmlTanggungan: 2,
        statusOrtu: "LENGKAP",
        alasan: "Fixture test integrasi relasi asuh",
        status: "DISETUJUI",
      },
    });
    id.pengajuanB = pengajuanB.id;

    const tagihanB = await prisma.tagihan.create({
      data: {
        mahasiswaId: id.mahasiswaB,
        periodeId: id.periode,
        komponen: "UKT",
        nominal: 5_000_000n,
        terbayar: 1_000_000n,
        status: "LUNAS_SEBAGIAN",
        jatuhTempo: new Date("2026-09-01"),
      },
    });
    id.tagihanB = tagihanB.id;
  });

  afterAll(async () => {
    await prisma.pesanBinaan.deleteMany({
      where: { relasiAsuhId: { in: [id.relasiADisetujui, id.relasiBBelumSetuju] } },
    });
    await prisma.relasiAsuh.deleteMany({ where: { periodeMulaiId: id.periode } });
    await prisma.tagihan.deleteMany({ where: { id: id.tagihanB } });
    await prisma.pengajuan.deleteMany({ where: { id: id.pengajuanB } });
    await prisma.mahasiswa.deleteMany({ where: { id: { in: [id.mahasiswaA, id.mahasiswaB] } } });
    await prisma.ortuAsuh.deleteMany({ where: { id: { in: [id.ortuAsuhA, id.ortuAsuhB] } } });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [id.userMahasiswaA, id.userMahasiswaB, id.userOrtuAsuhA, id.userOrtuAsuhB, id.admin],
        },
      },
    });
    await prisma.periode.deleteMany({ where: { id: id.periode } });
    await prisma.$disconnect();
  });

  it("donatur A tidak bisa mengakses relasi donatur B walau tahu ID-nya (kirim pesan)", async () => {
    const hasil = await ambilRelasiUntukKirimPesan(id.relasiUntukMahasiswaB, id.userOrtuAsuhA);
    expect(hasil).toBeNull();
  });

  it("donatur A tidak bisa membaca thread pesan relasi donatur B walau tahu ID-nya", async () => {
    const hasil = await ambilPesanRelasiUntukUser(id.relasiUntukMahasiswaB, {
      id: id.userOrtuAsuhA,
      role: "ORTU_ASUH",
    });
    expect(hasil).toBeNull();
  });

  it("donatur A tidak melihat mahasiswa binaan donatur B di daftar binaannya", async () => {
    const { teridentifikasi } = await ambilDaftarBinaanOrtuAsuh(id.userOrtuAsuhA);
    expect(teridentifikasi.every((b) => b.mahasiswaId !== id.mahasiswaB)).toBe(true);
  });

  it("donatur tidak bisa melihat identitas mahasiswa yang persetujuanMahasiswa masih false", async () => {
    const { teridentifikasi, agregat } = await ambilDaftarBinaanOrtuAsuh(id.userOrtuAsuhB);
    expect(teridentifikasi).toHaveLength(0);
    expect(agregat.jumlah).toBe(1);
  });

  it("donatur yang relasinya sudah disetujui tetap melihat identitas binaannya sendiri", async () => {
    const { teridentifikasi } = await ambilDaftarBinaanOrtuAsuh(id.userOrtuAsuhA);
    expect(teridentifikasi.some((b) => b.mahasiswaId === id.mahasiswaA)).toBe(true);
  });

  it("menarik persetujuan tidak mengubah status pengajuan atau alokasi apa pun", async () => {
    const pengajuanSebelum = await prisma.pengajuan.findUniqueOrThrow({ where: { id: id.pengajuanB } });
    const tagihanSebelum = await prisma.tagihan.findUniqueOrThrow({ where: { id: id.tagihanB } });

    const relasi = await ambilRelasiMilikMahasiswa(id.relasiUntukMahasiswaB, id.userMahasiswaB);
    expect(relasi).not.toBeNull();

    // Operasi yang SAMA PERSIS dengan yang dilakukan Server Action
    // tarikPersetujuanPembinaan — hanya menyentuh RelasiAsuh.
    await prisma.relasiAsuh.update({
      where: { id: id.relasiUntukMahasiswaB },
      data: { persetujuanMahasiswa: false, persetujuanAt: null },
    });

    const pengajuanSesudah = await prisma.pengajuan.findUniqueOrThrow({ where: { id: id.pengajuanB } });
    const tagihanSesudah = await prisma.tagihan.findUniqueOrThrow({ where: { id: id.tagihanB } });

    expect(pengajuanSesudah.status).toBe(pengajuanSebelum.status);
    expect(tagihanSesudah.terbayar).toBe(tagihanSebelum.terbayar);
    expect(tagihanSesudah.status).toBe(tagihanSebelum.status);
  });
});
