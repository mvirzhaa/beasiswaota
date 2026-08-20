import { describe, expect, it } from "vitest";
import { hitungBatasKirimLaporan } from "./batas-laporan";

describe("hitungBatasKirimLaporan", () => {
  it("menambah 30 hari dari tglTutup periode", () => {
    const batas = hitungBatasKirimLaporan({ tglTutup: new Date(Date.UTC(2026, 8, 30)) });
    expect(batas.toISOString().slice(0, 10)).toBe("2026-10-30");
  });

  it("deterministik untuk input yang sama", () => {
    const periode = { tglTutup: new Date(Date.UTC(2026, 0, 1)) };
    expect(hitungBatasKirimLaporan(periode).getTime()).toBe(
      hitungBatasKirimLaporan(periode).getTime(),
    );
  });
});
