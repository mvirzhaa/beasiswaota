import { describe, expect, it } from "vitest";
import { UKURAN_MAKS_BYTE, validasiBerkas } from "./validasi";

describe("validasiBerkas", () => {
  it("menerima PDF di bawah batas ukuran", () => {
    expect(
      validasiBerkas({ mimeType: "application/pdf", ukuranByte: 1024 }).valid,
    ).toBe(true);
  });

  it("menerima JPG dan PNG", () => {
    expect(validasiBerkas({ mimeType: "image/jpeg", ukuranByte: 1024 }).valid).toBe(
      true,
    );
    expect(validasiBerkas({ mimeType: "image/png", ukuranByte: 1024 }).valid).toBe(
      true,
    );
  });

  it("menolak MIME type di luar PDF/JPG/PNG", () => {
    const hasil = validasiBerkas({ mimeType: "text/plain", ukuranByte: 100 });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toMatch(/PDF, JPG, atau PNG/);
  });

  it("menolak berkas kosong", () => {
    expect(
      validasiBerkas({ mimeType: "application/pdf", ukuranByte: 0 }).valid,
    ).toBe(false);
  });

  it("menerima persis di batas 5MB", () => {
    expect(
      validasiBerkas({ mimeType: "application/pdf", ukuranByte: UKURAN_MAKS_BYTE })
        .valid,
    ).toBe(true);
  });

  it("menolak berkas lebih dari 5MB", () => {
    const hasil = validasiBerkas({
      mimeType: "application/pdf",
      ukuranByte: UKURAN_MAKS_BYTE + 1,
    });
    expect(hasil.valid).toBe(false);
    expect(hasil.pesan).toMatch(/5MB/);
  });
});
