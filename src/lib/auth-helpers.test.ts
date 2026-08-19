import { describe, expect, it } from "vitest";
import { bolehLogin } from "./auth-helpers";

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
