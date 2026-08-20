import { describe, expect, it } from "vitest";
import { parseBarisRealisasiPotongGaji, type BarisRealisasiMentah } from "./xlsx-parse";

function baris(nomor: number, data: Partial<BarisRealisasiMentah>) {
  return {
    baris: nomor,
    data: {
      jadwalBayarId: "",
      nip: "",
      nominal: "",
      tanggal: "",
      ...data,
    },
  };
}

describe("parseBarisRealisasiPotongGaji", () => {
  it("baris valid lengkap diterima", () => {
    const hasil = parseBarisRealisasiPotongGaji([
      baris(2, { jadwalBayarId: "jb1", nip: "198501012010012001", nominal: 500000, tanggal: "2026-08-25" }),
    ]);
    expect(hasil.error).toHaveLength(0);
    expect(hasil.valid[0].jadwalBayarId).toBe("jb1");
    expect(hasil.valid[0].nip).toBe("198501012010012001");
    expect(hasil.valid[0].nominal).toBe(500000n);
  });

  it("JadwalBayarId kosong ditolak", () => {
    const hasil = parseBarisRealisasiPotongGaji([baris(3, { nip: "123" })]);
    expect(hasil.error[0].pesan).toMatch(/JadwalBayarId kosong/);
  });

  it("NIP kosong ditolak", () => {
    const hasil = parseBarisRealisasiPotongGaji([baris(4, { jadwalBayarId: "jb1" })]);
    expect(hasil.error[0].pesan).toMatch(/NIP kosong/);
  });

  it("nominal non-angka ditolak", () => {
    const hasil = parseBarisRealisasiPotongGaji([
      baris(5, { jadwalBayarId: "jb1", nip: "123", nominal: "abc" }),
    ]);
    expect(hasil.error[0].pesan).toMatch(/Nominal tidak valid/);
  });

  it("nominal nol atau negatif ditolak", () => {
    const hasil = parseBarisRealisasiPotongGaji([
      baris(6, { jadwalBayarId: "jb1", nip: "123", nominal: 0 }),
    ]);
    expect(hasil.error[0].pesan).toMatch(/Nominal tidak valid/);
  });

  it("tanggal tidak valid ditolak", () => {
    const hasil = parseBarisRealisasiPotongGaji([
      baris(7, { jadwalBayarId: "jb1", nip: "123", nominal: 100, tanggal: "bukan-tanggal" }),
    ]);
    expect(hasil.error[0].pesan).toMatch(/Tanggal realisasi tidak valid/);
  });
});
