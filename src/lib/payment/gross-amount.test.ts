import { describe, expect, it } from "vitest";
import { parseGrossAmount, formatGrossAmount } from "./gross-amount";

describe("parseGrossAmount", () => {
  it("mem-parse string dengan sen .00 jadi bigint Rupiah penuh", () => {
    expect(parseGrossAmount("150000.00")).toBe(150_000n);
  });

  it("menerima nol", () => {
    expect(parseGrossAmount("0.00")).toBe(0n);
  });

  it("menolak sen pecahan bukan nol", () => {
    expect(() => parseGrossAmount("150000.50")).toThrow(/sen pecahan/);
  });

  it("menolak format tanpa desimal", () => {
    expect(() => parseGrossAmount("150000")).toThrow(/tidak dikenali/);
  });

  it("menolak string bukan angka", () => {
    expect(() => parseGrossAmount("abc")).toThrow(/tidak dikenali/);
  });
});

describe("formatGrossAmount", () => {
  it("selalu menambahkan .00", () => {
    expect(formatGrossAmount(150_000n)).toBe("150000.00");
  });

  it("round-trip dengan parseGrossAmount", () => {
    const nominal = 4_500_001n;
    expect(parseGrossAmount(formatGrossAmount(nominal))).toBe(nominal);
  });
});
