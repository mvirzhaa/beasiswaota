import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { jalankanAlokasi } from "./engine";

// Test integrasi database sungguhan untuk earmarking (Fase 2): dana yang
// di-earmark donatur ke 1 mahasiswa tertentu (Komitmen.targetMahasiswaId)
// tidak boleh bocor ke mahasiswa lain, dan tetap tidak mengubah satu baris
// pun logika susunRencana() (lihat komentar di engine.ts). Dilewati otomatis
// kalau DATABASE_URL tidak terjangkau, sama seperti engine.integration.test.ts.
const prisma = new PrismaClient();

let dbReady = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReady = true;
} catch {
  dbReady = false;
}

describe.skipIf(!dbReady)("jalankanAlokasi — earmark (integrasi database sungguhan)", () => {
  const sufiks = randomUUID().slice(0, 8);
  let userAdminId = "";

  // Semua id yang dibuat sepanjang seluruh describe ini, dibersihkan sekaligus
  // di afterAll — dipakai array (bukan field tunggal) karena kedua test di
  // bawah sama-sama membuat fixture baru dan tidak boleh saling menimpa id
  // yang perlu dihapus.
  const periodeIds: string[] = [];
  const userIds: string[] = [];
  const mahasiswaIds: string[] = [];
  const tagihanIds: string[] = [];
  const ortuAsuhIds: string[] = [];
  const komitmenIds: string[] = [];
  const transaksiIds: string[] = [];

  // Setiap test membuat periode SENDIRI (bukan berbagi satu periode) — kalau
  // dibagi, tagihan dari test sebelumnya yang belum di-setujuiBatch() (masih
  // BELUM_LUNAS, karena jalankanAlokasi hanya membuat Alokasi DRAFT) akan
  // ikut jadi kandidat di test berikutnya dan mengacaukan hasil yang diuji.
  async function buatPeriode(kode: string) {
    const periode = await prisma.periode.create({
      data: {
        kode: `TEST-EARMARK-${kode}-${sufiks}`,
        tahunAkademik: "2026/2027",
        semester: 1,
        nominalFull: 1_000_000n,
        tglBuka: new Date("2026-08-01"),
        tglTutup: new Date("2026-09-30"),
        status: "SELEKSI",
      },
    });
    periodeIds.push(periode.id);
    return periode.id;
  }

  async function buatMahasiswaDenganSkor(
    periodeId: string,
    kode: string,
    skor: number,
    nominalTagihan: bigint,
  ) {
    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        nim: `EARMARK-${kode}-${sufiks}`,
        nama: `Mahasiswa Uji Earmark ${kode}`,
        fakultas: "Fakultas Uji",
        prodi: "Prodi Uji",
        angkatan: 2025,
        semesterBerjalan: 1,
        noHp: "080000000000",
        statusAkademik: "AKTIF",
      },
    });
    mahasiswaIds.push(mahasiswa.id);

    await prisma.pengajuan.create({
      data: {
        mahasiswaId: mahasiswa.id,
        periodeId,
        nominalKebutuhan: nominalTagihan,
        penghasilanOrtu: 1_000_000n,
        jmlTanggungan: 2,
        statusOrtu: "LENGKAP",
        alasan: "Fixture test earmark",
        skor,
        status: "DISETUJUI",
      },
    });

    const tagihan = await prisma.tagihan.create({
      data: {
        mahasiswaId: mahasiswa.id,
        periodeId,
        komponen: "UKT",
        nominal: nominalTagihan,
        terbayar: 0n,
        jatuhTempo: new Date("2026-09-01"),
        status: "BELUM_LUNAS",
      },
    });
    tagihanIds.push(tagihan.id);

    return { mahasiswaId: mahasiswa.id, tagihanId: tagihan.id };
  }

  async function buatDonaturTerverifikasi(
    periodeId: string,
    kode: string,
    nominal: bigint,
    targetMahasiswaId: string | null,
  ) {
    const ortuAsuh = await prisma.ortuAsuh.create({
      data: { nama: `Donatur Uji ${kode}`, tipe: "INDIVIDU", noHp: "080000000001" },
    });
    ortuAsuhIds.push(ortuAsuh.id);

    let komitmenId: string | null = null;
    if (targetMahasiswaId) {
      const komitmen = await prisma.komitmen.create({
        data: {
          ortuAsuhId: ortuAsuh.id,
          skema: "PARSIAL",
          nominalPerPeriode: nominal,
          jumlahPeriode: 1,
          tipe: "SEKALI",
          mekanisme: "TRANSFER_MANUAL",
          targetMahasiswaId,
          tglMulai: new Date("2026-08-01"),
        },
      });
      komitmenId = komitmen.id;
      komitmenIds.push(komitmen.id);
    }

    const transaksi = await prisma.transaksi.create({
      data: {
        ortuAsuhId: ortuAsuh.id,
        komitmenId,
        nominal,
        metode: "TRANSFER_MANUAL",
        status: "TERVERIFIKASI",
        tglBayar: new Date("2026-08-05"),
      },
    });
    transaksiIds.push(transaksi.id);

    await prisma.danaLedger.create({
      data: {
        periodeId,
        tipe: "KREDIT",
        nominal,
        saldoSetelah: nominal,
        transaksiId: transaksi.id,
        keterangan: `Fixture earmark test — ${kode}`,
      },
    });

    return { transaksiId: transaksi.id };
  }

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: `admin-earmark-${sufiks}@uika-bogor.ac.id`,
        passwordHash: "x",
        role: "ADMIN",
        status: "AKTIF",
      },
    });
    userAdminId = admin.id;
    userIds.push(admin.id);
  });

  afterAll(async () => {
    await prisma.alokasiSumber.deleteMany({ where: { alokasi: { periodeId: { in: periodeIds } } } });
    await prisma.alokasi.deleteMany({ where: { periodeId: { in: periodeIds } } });
    await prisma.danaLedger.deleteMany({ where: { periodeId: { in: periodeIds } } });
    await prisma.transaksi.deleteMany({ where: { id: { in: transaksiIds } } });
    await prisma.komitmen.deleteMany({ where: { id: { in: komitmenIds } } });
    await prisma.ortuAsuh.deleteMany({ where: { id: { in: ortuAsuhIds } } });
    await prisma.tagihan.deleteMany({ where: { id: { in: tagihanIds } } });
    await prisma.pengajuan.deleteMany({ where: { periodeId: { in: periodeIds } } });
    await prisma.mahasiswa.deleteMany({ where: { id: { in: mahasiswaIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.periode.deleteMany({ where: { id: { in: periodeIds } } });
    await prisma.$disconnect();
  });

  it("earmark ke mahasiswa berskor rendah tidak bocor ke mahasiswa berskor tinggi; pool umum tetap mendanai yang berskor tinggi", async () => {
    const periodeId = await buatPeriode("1");
    const a = await buatMahasiswaDenganSkor(periodeId, "A", 90, 1_000_000n); // skor tinggi
    const b = await buatMahasiswaDenganSkor(periodeId, "B", 50, 1_000_000n); // skor rendah, tapi di-earmark

    const earmark = await buatDonaturTerverifikasi(periodeId, "earmark", 1_000_000n, b.mahasiswaId);
    const umum = await buatDonaturTerverifikasi(periodeId, "umum", 1_000_000n, null);

    const { rencana, batchId } = await jalankanAlokasi(prisma, {
      periodeId,
      dryRun: false,
      dibuatOlehId: userAdminId,
    });

    expect(batchId).not.toBeNull();
    expect(rencana.penerima).toHaveLength(2);
    expect(rencana.totalDialokasikan).toBe(2_000_000n);

    // Satu batch tunggal — approval admin (setujuiBatch) tidak berubah.
    const jumlahAlokasiBatch = await prisma.alokasi.count({ where: { batchId: batchId! } });
    expect(jumlahAlokasiBatch).toBe(2);

    // Sumber dana mahasiswa B (di-earmark) HANYA dari transaksi earmark.
    const sumberB = await prisma.alokasiSumber.findMany({
      where: { alokasi: { tagihanId: b.tagihanId } },
    });
    expect(sumberB.map((s) => s.transaksiId)).toEqual([earmark.transaksiId]);

    // Sumber dana mahasiswa A (pool umum, skor tinggi) HANYA dari transaksi umum,
    // BUKAN dari dana yang di-earmark untuk B walau skor A lebih tinggi.
    const sumberA = await prisma.alokasiSumber.findMany({
      where: { alokasi: { tagihanId: a.tagihanId } },
    });
    expect(sumberA.map((s) => s.transaksiId)).toEqual([umum.transaksiId]);
  });

  it("earmark yang belum cukup tidak menahan mahasiswa dari pool umum, dan tidak ikut terpakai", async () => {
    const periodeId = await buatPeriode("2");
    const b = await buatMahasiswaDenganSkor(periodeId, "B2", 50, 1_000_000n);

    // Earmark cuma 500rb — tidak cukup melunasi tagihan 1jt (mode KUOTA_TUNTAS).
    const earmark = await buatDonaturTerverifikasi(periodeId, "earmark2", 500_000n, b.mahasiswaId);
    // Pool umum 1jt, cukup untuk melunasi tagihan B lewat jalur umum.
    const umum = await buatDonaturTerverifikasi(periodeId, "umum2", 1_000_000n, null);

    const { rencana, batchId } = await jalankanAlokasi(prisma, {
      periodeId,
      dryRun: false,
      dibuatOlehId: userAdminId,
    });

    expect(batchId).not.toBeNull();
    expect(rencana.penerima).toHaveLength(1);
    expect(rencana.penerima[0].tagihanId).toBe(b.tagihanId);

    // B lunas dari dana UMUM, bukan dari 500rb yang di-earmark untuknya.
    const sumberB = await prisma.alokasiSumber.findMany({
      where: { alokasi: { tagihanId: b.tagihanId } },
    });
    expect(sumberB.map((s) => s.transaksiId)).toEqual([umum.transaksiId]);

    // Dana earmark 500rb tidak tersentuh sama sekali (masih 100% sisa).
    const terpakaiEarmark = await prisma.alokasiSumber.aggregate({
      where: { transaksiId: earmark.transaksiId },
      _sum: { nominal: true },
    });
    expect(terpakaiEarmark._sum.nominal ?? 0n).toBe(0n);
  });
});
