import { describe, expect, it } from "vitest";
import { formatRupiah, parseRupiah } from "./uang";

describe("formatRupiah", () => {
  it("format nol", () => {
    expect(formatRupiah(0n)).toBe("Rp0");
  });

  it("format nominal biasa dengan pemisah ribuan", () => {
    expect(formatRupiah(1_500_000n)).toBe("Rp1.500.000");
  });

  it("format angka besar melebihi batas Number aman", () => {
    expect(formatRupiah(9_007_199_254_740_993n)).toBe(
      "Rp9.007.199.254.740.993",
    );
  });
});

describe("parseRupiah", () => {
  it("parse string polos tanpa format", () => {
    expect(parseRupiah("1500000")).toBe(1_500_000n);
  });

  it("parse string dengan prefix Rp dan pemisah ribuan", () => {
    expect(parseRupiah("Rp1.500.000")).toBe(1_500_000n);
  });

  it("parse string dengan spasi setelah Rp", () => {
    expect(parseRupiah("Rp 1.500.000")).toBe(1_500_000n);
  });

  it("parse nol", () => {
    expect(parseRupiah("0")).toBe(0n);
    expect(parseRupiah("Rp0")).toBe(0n);
  });

  it("parse angka besar", () => {
    expect(parseRupiah("9.007.199.254.740.993")).toBe(
      9_007_199_254_740_993n,
    );
  });

  it("menolak input kosong", () => {
    expect(() => parseRupiah("")).toThrow();
    expect(() => parseRupiah("   ")).toThrow();
  });

  it("menolak input bukan angka", () => {
    expect(() => parseRupiah("abc")).toThrow();
  });

  it("menolak input dengan sen karena Rupiah tidak punya pecahan", () => {
    expect(() => parseRupiah("1.500.000,50")).toThrow();
  });

  it("menerima akhiran ,00 sebagai nol sen", () => {
    expect(parseRupiah("1.500.000,00")).toBe(1_500_000n);
  });

  it("menolak nominal negatif", () => {
    expect(() => parseRupiah("-1000")).toThrow();
  });
});
