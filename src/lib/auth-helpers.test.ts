import { describe, expect, it } from "vitest";
import { bolehLogin, buatPasswordSementara } from "./auth-helpers";

describe("bolehLogin", () => {
  it("meloloskan user AKTIF", () => {
    expect(bolehLogin("AKTIF")).toBe(true);
  });

  it("menolak user MENUNGGU_VERIFIKASI", () => {
    expect(bolehLogin("MENUNGGU_VERIFIKASI")).toBe(false);
  });

  it("menolak user NONAKTIF", () => {
    expect(bolehLogin("NONAKTIF")).toBe(false);
  });

  it("menolak user DIBLOKIR", () => {
    expect(bolehLogin("DIBLOKIR")).toBe(false);
  });
});

describe("buatPasswordSementara", () => {
  it("menghasilkan panjang default 12 karakter", () => {
    expect(buatPasswordSementara()).toHaveLength(12);
  });

  it("menghormati panjang kustom", () => {
    expect(buatPasswordSementara(20)).toHaveLength(20);
  });

  it("tidak mengandung karakter yang gampang tertukar (0, O, 1, l, I)", () => {
    const password = buatPasswordSementara(200);
    expect(password).not.toMatch(/[0O1lI]/);
  });

  it("berbeda tiap dipanggil (acak)", () => {
    expect(buatPasswordSementara()).not.toBe(buatPasswordSementara());
  });
});
