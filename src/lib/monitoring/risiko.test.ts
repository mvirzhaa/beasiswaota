import { describe, expect, it } from "vitest";
import { hitungRisiko } from "./risiko";
import { AMBANG_RISIKO_DEFAULT } from "./risiko.schema";

describe("hitungRisiko", () => {
  it("IPK di bawah ambang minimum -> PERHATIAN", () => {
    const hasil = hitungRisiko(
      { ipk: 2.2, ipkSemesterLalu: 2.3, statusAkademik: "AKTIF" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("PERHATIAN");
  });

  it("IPK turun lebih dari ambang penurunan -> PERHATIAN meski masih di atas ipkMinimum", () => {
    const hasil = hitungRisiko(
      { ipk: 3.0, ipkSemesterLalu: 3.6, statusAkademik: "AKTIF" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("PERHATIAN");
  });

  it("IPK stabil di atas ambang minimum -> AMAN", () => {
    const hasil = hitungRisiko(
      { ipk: 3.5, ipkSemesterLalu: 3.6, statusAkademik: "AKTIF" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("AMAN");
  });

  it("status CUTI -> KRITIS berapa pun IPK-nya", () => {
    const hasil = hitungRisiko(
      { ipk: 3.9, ipkSemesterLalu: 3.9, statusAkademik: "CUTI" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("KRITIS");
  });

  it("status DO -> KRITIS", () => {
    const hasil = hitungRisiko(
      { ipk: null, ipkSemesterLalu: null, statusAkademik: "DO" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("KRITIS");
  });

  it("status LULUS -> AMAN meski IPK di bawah ambang", () => {
    const hasil = hitungRisiko(
      { ipk: 2.0, ipkSemesterLalu: 2.5, statusAkademik: "LULUS" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("AMAN");
  });

  it("data semester pertama (ipkSemesterLalu null) tidak error dan tidak memicu PERHATIAN dari cek penurunan", () => {
    const hasil = hitungRisiko(
      { ipk: 3.2, ipkSemesterLalu: null, statusAkademik: "AKTIF" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("AMAN");
  });

  it("data semester pertama dengan IPK awal rendah tetap PERHATIAN dari cek ambang minimum", () => {
    const hasil = hitungRisiko(
      { ipk: 2.0, ipkSemesterLalu: null, statusAkademik: "AKTIF" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("PERHATIAN");
  });

  it("IPK belum diinput (null) untuk mahasiswa AKTIF -> AMAN, bukan error", () => {
    const hasil = hitungRisiko(
      { ipk: null, ipkSemesterLalu: 3.0, statusAkademik: "AKTIF" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("AMAN");
  });

  it("penurunan persis di batas ambang tidak dianggap PERHATIAN (harus melebihi, bukan sama dengan)", () => {
    const hasil = hitungRisiko(
      { ipk: 3.0, ipkSemesterLalu: 3.5, statusAkademik: "AKTIF" },
      AMBANG_RISIKO_DEFAULT,
    );
    expect(hasil).toBe("AMAN");
  });
});
