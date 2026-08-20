import { describe, expect, it } from "vitest";
import { parseBarisMonitoring, type BarisMentahMonitoring } from "./xlsx-parse";

function baris(baris: number, data: Partial<BarisMentahMonitoring>) {
  return {
    baris,
    data: {
      nim: "",
      ipSemester: "",
      ipk: "",
      sksSemester: "",
      sksKumulatif: "",
      statusAkademik: "AKTIF",
      persenKehadiran: "",
      ...data,
    },
  };
}

describe("parseBarisMonitoring", () => {
  it("baris valid lengkap diterima dan dinormalisasi jadi number", () => {
    const hasil = parseBarisMonitoring([
      baris(2, {
        nim: "1200001",
        ipSemester: 3.5,
        ipk: 3.4,
        sksSemester: 20,
        sksKumulatif: 100,
        statusAkademik: "aktif",
        persenKehadiran: 90,
      }),
    ]);
    expect(hasil.error).toHaveLength(0);
    expect(hasil.valid).toEqual([
      {
        baris: 2,
        nim: "1200001",
        ipSemester: 3.5,
        ipk: 3.4,
        sksSemester: 20,
        sksKumulatif: 100,
        statusAkademik: "AKTIF",
        persenKehadiran: 90,
      },
    ]);
  });

  it("NIM kosong ditolak", () => {
    const hasil = parseBarisMonitoring([baris(3, { nim: "" })]);
    expect(hasil.valid).toHaveLength(0);
    expect(hasil.error[0].pesan).toMatch(/NIM kosong/);
  });

  it("status akademik tidak dikenal ditolak", () => {
    const hasil = parseBarisMonitoring([baris(4, { nim: "1200002", statusAkademik: "LIBUR" })]);
    expect(hasil.valid).toHaveLength(0);
    expect(hasil.error[0].pesan).toMatch(/Status akademik tidak valid/);
  });

  it("kolom angka yang tidak bisa di-parse ditolak dengan pesan jelas", () => {
    const hasil = parseBarisMonitoring([baris(5, { nim: "1200003", ipk: "abc" })]);
    expect(hasil.valid).toHaveLength(0);
    expect(hasil.error[0].pesan).toMatch(/IPK/);
  });

  it("IPK di luar rentang 0-4 ditolak", () => {
    const hasil = parseBarisMonitoring([baris(6, { nim: "1200004", ipk: 5 })]);
    expect(hasil.valid).toHaveLength(0);
    expect(hasil.error[0].pesan).toMatch(/rentang 0-4/);
  });

  it("sel kosong dinormalisasi jadi null, bukan error", () => {
    const hasil = parseBarisMonitoring([baris(7, { nim: "1200005", ipk: "", ipSemester: "" })]);
    expect(hasil.error).toHaveLength(0);
    expect(hasil.valid[0].ipk).toBeNull();
    expect(hasil.valid[0].ipSemester).toBeNull();
  });

  it("baris valid dan error dalam satu batch tetap terpisah dengan benar", () => {
    const hasil = parseBarisMonitoring([
      baris(2, { nim: "1200001", ipk: 3.0 }),
      baris(3, { nim: "" }),
      baris(4, { nim: "1200002", ipk: 3.2 }),
    ]);
    expect(hasil.valid.map((v) => v.baris)).toEqual([2, 4]);
    expect(hasil.error.map((e) => e.baris)).toEqual([3]);
  });
});
