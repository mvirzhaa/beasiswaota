import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { daftarDonatur } from "./actions";

// Test integrasi database sungguhan — memvalidasi form pendaftaran donatur v2
// (cabang Perorangan/Lembaga, Internal/Eksternal, earmark mahasiswa) benar-benar
// menulis OrtuAsuh+Komitmen yang konsisten, TANPA membuat akun/User sama
// sekali (donatur tidak login — lihat CLAUDE.md). Dilewati otomatis kalau
// DATABASE_URL tidak terjangkau, sama seperti engine.integration.test.ts.
const prisma = new PrismaClient();

let dbReady = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReady = true;
} catch {
  dbReady = false;
}

describe.skipIf(!dbReady)("daftarDonatur — integrasi database sungguhan", () => {
  const sufiks = randomUUID().slice(0, 8);
  const emailBuatan: string[] = [];
  const idsUntukDihapus = { periode: "", mahasiswa: "" };

  beforeAll(async () => {
    const periode = await prisma.periode.create({
      data: {
        kode: `TEST-DAFTAR-${sufiks}`,
        tahunAkademik: "2026/2027",
        semester: 1,
        nominalFull: 5_000_000n,
        tglBuka: new Date("2026-08-01"),
        tglTutup: new Date("2026-09-30"),
        status: "PENDAFTARAN",
      },
    });
    idsUntukDihapus.periode = periode.id;

    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        nim: `TESTDAFTAR-${sufiks}`,
        nama: "Mahasiswa Uji Earmark",
        fakultas: "Fakultas Uji",
        prodi: "Prodi Uji",
        angkatan: 2025,
        semesterBerjalan: 1,
        noHp: "080000000000",
        statusAkademik: "AKTIF",
      },
    });
    idsUntukDihapus.mahasiswa = mahasiswa.id;
  });

  afterAll(async () => {
    await prisma.jadwalBayar.deleteMany({ where: { komitmen: { ortuAsuh: { email: { in: emailBuatan } } } } });
    await prisma.komitmen.deleteMany({ where: { ortuAsuh: { email: { in: emailBuatan } } } });
    await prisma.ortuAsuh.deleteMany({ where: { email: { in: emailBuatan } } });
    await prisma.mahasiswa.deleteMany({ where: { id: idsUntukDihapus.mahasiswa } });
    await prisma.periode.deleteMany({ where: { id: idsUntukDihapus.periode } });
    await prisma.$disconnect();
  });

  function inputDasar(overrides: Record<string, unknown> = {}) {
    const email = `donatur-${randomUUID().slice(0, 8)}@example.com`;
    emailBuatan.push(email);
    return {
      kategori: "PERORANGAN",
      internal: "false",
      nama: "Donatur Uji",
      email,
      noHp: "081234567890",
      alamat: "Jl. Uji No. 1",
      nominal: "100000",
      tipeKomitmen: "SEKALI",
      mekanisme: "TRANSFER_MANUAL",
      skema: "PARSIAL",
      targetPenyaluran: "SEMUA_PENERIMA",
      ...overrides,
    };
  }

  it("Perorangan-Eksternal berhasil, komitmen masuk pool umum (targetMahasiswaId null), tanpa membuat akun", async () => {
    const hasil = await daftarDonatur(inputDasar());
    expect(hasil.sukses).toBe(true);

    const ortuAsuh = await prisma.ortuAsuh.findFirst({ where: { email: emailBuatan.at(-1) } });
    expect(ortuAsuh).not.toBeNull();
    expect(ortuAsuh?.kodeAkses).toBeTruthy();

    const komitmen = await prisma.komitmen.findFirst({
      where: { ortuAsuhId: ortuAsuh!.id },
    });
    expect(komitmen?.targetMahasiswaId).toBeNull();
    expect(komitmen?.tipe).toBe("SEKALI");
    expect(komitmen?.jumlahPeriode).toBe(1);
    expect(komitmen?.nominalPerPeriode).toBe(100_000n);

    const jumlahUser = await prisma.user.count({ where: { email: emailBuatan.at(-1) } });
    expect(jumlahUser).toBe(0);
  });

  it("earmark ke 1 mahasiswa tersimpan di Komitmen.targetMahasiswaId", async () => {
    const hasil = await daftarDonatur(
      inputDasar({
        targetPenyaluran: "SATU_MAHASISWA",
        targetMahasiswaId: idsUntukDihapus.mahasiswa,
      }),
    );
    expect(hasil.sukses).toBe(true);

    const ortuAsuh = await prisma.ortuAsuh.findFirst({ where: { email: emailBuatan.at(-1) } });
    const komitmen = await prisma.komitmen.findFirst({ where: { ortuAsuhId: ortuAsuh!.id } });
    expect(komitmen?.targetMahasiswaId).toBe(idsUntukDihapus.mahasiswa);
  });

  it("bantuan berkelanjutan tersimpan dengan tanggalPengingat dan jumlahPeriode 8", async () => {
    const hasil = await daftarDonatur(
      inputDasar({ tipeKomitmen: "BERULANG", tanggalPengingat: "25" }),
    );
    expect(hasil.sukses).toBe(true);

    const ortuAsuh = await prisma.ortuAsuh.findFirst({ where: { email: emailBuatan.at(-1) } });
    const komitmen = await prisma.komitmen.findFirst({ where: { ortuAsuhId: ortuAsuh!.id } });
    expect(komitmen?.tipe).toBe("BERULANG");
    expect(komitmen?.jumlahPeriode).toBe(8);
    expect(komitmen?.tanggalPengingat).toBe(25);
  });

  it("menolak nominal di bawah Rp50.000", async () => {
    const hasil = await daftarDonatur(inputDasar({ nominal: "10000" }));
    expect(hasil.sukses).toBe(false);
    expect(hasil.pesan).toMatch(/minimal Rp50\.000/i);
  });

  it("menolak potong gaji untuk donatur Eksternal", async () => {
    const hasil = await daftarDonatur(
      inputDasar({ internal: "false", mekanisme: "POTONG_GAJI" }),
    );
    expect(hasil.sukses).toBe(false);
    expect(hasil.pesan).toMatch(/internal/i);
  });

  it("Perorangan-Internal boleh memilih potong gaji", async () => {
    const hasil = await daftarDonatur(
      inputDasar({ internal: "true", mekanisme: "POTONG_GAJI", alamat: undefined }),
    );
    expect(hasil.sukses).toBe(true);

    const ortuAsuh = await prisma.ortuAsuh.findFirst({ where: { email: emailBuatan.at(-1) } });
    const komitmen = await prisma.komitmen.findFirst({ where: { ortuAsuhId: ortuAsuh!.id } });
    expect(komitmen?.mekanisme).toBe("POTONG_GAJI");
    expect(komitmen?.ritme).toBe("PER_BULAN");
  });

  it("Lembaga wajib mengisi alamat lengkap", async () => {
    const hasil = await daftarDonatur(
      inputDasar({ kategori: "LEMBAGA", internal: undefined, alamat: undefined }),
    );
    expect(hasil.sukses).toBe(false);
    expect(hasil.pesan).toMatch(/alamat/i);
  });

  it("checklist Atas Nama menyimpan atasNamaMunfiq", async () => {
    const hasil = await daftarDonatur(
      inputDasar({ atasNama: "true", namaAtasNama: "Hamba Allah" }),
    );
    expect(hasil.sukses).toBe(true);

    const ortuAsuh = await prisma.ortuAsuh.findFirst({ where: { email: emailBuatan.at(-1) } });
    expect(ortuAsuh?.atasNamaMunfiq).toBe("Hamba Allah");
    expect(ortuAsuh?.paguyuban).toBe(false);
  });

  it("checklist Paguyuban menyimpan namaPaguyuban", async () => {
    const hasil = await daftarDonatur(
      inputDasar({ paguyuban: "true", namaPaguyuban: "Paguyuban Uji" }),
    );
    expect(hasil.sukses).toBe(true);

    const ortuAsuh = await prisma.ortuAsuh.findFirst({ where: { email: emailBuatan.at(-1) } });
    expect(ortuAsuh?.paguyuban).toBe(true);
    expect(ortuAsuh?.namaPaguyuban).toBe("Paguyuban Uji");
  });
});
