import { describe, expect, it } from "vitest";
import { cekKontakTerlarang } from "./validasi-pesan";

describe("cekKontakTerlarang", () => {
  it("pesan wajar tanpa kontak diizinkan", () => {
    const hasil = cekKontakTerlarang("Terima kasih atas dukungannya, semoga sehat selalu.");
    expect(hasil.diizinkan).toBe(true);
  });

  it("alamat email diblokir", () => {
    const hasil = cekKontakTerlarang("Bisa hubungi saya di budi123@gmail.com ya");
    expect(hasil.diizinkan).toBe(false);
    expect(hasil.alasan).toMatch(/email/);
  });

  it("nomor HP dengan strip diblokir", () => {
    const hasil = cekKontakTerlarang("Nomor saya 0812-3456-7890");
    expect(hasil.diizinkan).toBe(false);
    expect(hasil.alasan).toMatch(/telepon/);
  });

  it("nomor HP tanpa pemisah diblokir", () => {
    const hasil = cekKontakTerlarang("Hubungi 081234567890");
    expect(hasil.diizinkan).toBe(false);
  });

  it("nomor dalam kurung ala kode area diblokir", () => {
    const hasil = cekKontakTerlarang("Telepon kantor (021) 555-1234");
    expect(hasil.diizinkan).toBe(false);
  });

  it("angka pendek yang wajar (bukan kontak) tidak diblokir", () => {
    const hasil = cekKontakTerlarang("IPK saya semester ini 3.75, naik dari 3.2");
    expect(hasil.diizinkan).toBe(true);
  });

  it("tahun angkatan atau nominal pendek tidak diblokir", () => {
    const hasil = cekKontakTerlarang("Saya angkatan 2023, semoga bisa lulus 2027");
    expect(hasil.diizinkan).toBe(true);
  });
});
