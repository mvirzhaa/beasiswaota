import { describe, expect, it } from "vitest";
import { hitungSkor, type HitungSkorInput } from "./kelayakan";
import { BOBOT_SKORING_DEFAULT, type BobotSkoring } from "./bobot.schema";

const inputDasar: HitungSkorInput = {
  penghasilanOrtu: 2_000_000n,
  jmlTanggungan: 3,
  statusOrtu: "LENGKAP",
  ipk: 3.2,
  semesterBerjalan: 5,
};

describe("hitungSkor — kasus batas", () => {
  it("penghasilan nol memberi skor kriteria penghasilan 100 (paling butuh)", () => {
    const hasil = hitungSkor({ ...inputDasar, penghasilanOrtu: 0n }, BOBOT_SKORING_DEFAULT);
    expect(hasil.detail.rincian.penghasilan.skorNormalisasi).toBe(100);
  });

  it("penghasilan di atas batas atas memberi skor kriteria penghasilan 0", () => {
    const hasil = hitungSkor(
      { ...inputDasar, penghasilanOrtu: 50_000_000n },
      BOBOT_SKORING_DEFAULT,
    );
    expect(hasil.detail.rincian.penghasilan.skorNormalisasi).toBe(0);
  });

  it("penghasilan persis di batas bawah/atas tidak melebihi rentang", () => {
    const { penghasilan } = BOBOT_SKORING_DEFAULT;
    const diBawah = hitungSkor(
      { ...inputDasar, penghasilanOrtu: BigInt(penghasilan.batasBawah) },
      BOBOT_SKORING_DEFAULT,
    );
    const diAtas = hitungSkor(
      { ...inputDasar, penghasilanOrtu: BigInt(penghasilan.batasAtas) },
      BOBOT_SKORING_DEFAULT,
    );
    expect(diBawah.detail.rincian.penghasilan.skorNormalisasi).toBe(100);
    expect(diAtas.detail.rincian.penghasilan.skorNormalisasi).toBe(0);
  });

  it("IPK kosong (null) diberi skor 0 pada kriteria IPK, bukan error", () => {
    const hasil = hitungSkor({ ...inputDasar, ipk: null }, BOBOT_SKORING_DEFAULT);
    expect(hasil.detail.rincian.ipk.skorNormalisasi).toBe(0);
    expect(hasil.detail.rincian.ipk.nilaiMentah).toBeNull();
  });

  it("jumlah tanggungan di atas batasAtas tetap di-clamp ke 100", () => {
    const hasil = hitungSkor({ ...inputDasar, jmlTanggungan: 999 }, BOBOT_SKORING_DEFAULT);
    expect(hasil.detail.rincian.tanggungan.skorNormalisasi).toBe(100);
  });

  it("skor total selalu dalam rentang 0-100", () => {
    const kasus: HitungSkorInput[] = [
      { ...inputDasar, penghasilanOrtu: 0n, jmlTanggungan: 999, statusOrtu: "YATIM_PIATU", ipk: 4, semesterBerjalan: 999 },
      { ...inputDasar, penghasilanOrtu: 999_999_999n, jmlTanggungan: 0, statusOrtu: "LENGKAP", ipk: null, semesterBerjalan: 0 },
    ];
    for (const input of kasus) {
      const { skor } = hitungSkor(input, BOBOT_SKORING_DEFAULT);
      expect(skor).toBeGreaterThanOrEqual(0);
      expect(skor).toBeLessThanOrEqual(100);
    }
  });
});

describe("hitungSkor — determinisme", () => {
  it("input sama menghasilkan skor dan rincian yang identik", () => {
    const hasil1 = hitungSkor(inputDasar, BOBOT_SKORING_DEFAULT);
    const hasil2 = hitungSkor(inputDasar, BOBOT_SKORING_DEFAULT);
    expect(hasil2).toEqual(hasil1);
  });

  it("skorDetail menyimpan snapshot bobot yang dipakai", () => {
    const hasil = hitungSkor(inputDasar, BOBOT_SKORING_DEFAULT);
    expect(hasil.detail.bobotDipakai).toEqual(BOBOT_SKORING_DEFAULT);
  });
});

describe("hitungSkor — validasi total bobot", () => {
  it("melempar error kalau total bobot bukan 100", () => {
    const bobotRusak: BobotSkoring = {
      ...BOBOT_SKORING_DEFAULT,
      penghasilan: { ...BOBOT_SKORING_DEFAULT.penghasilan, bobot: 40 },
    };
    expect(() => hitungSkor(inputDasar, bobotRusak)).toThrow(/Total bobot skoring harus 100/);
  });

  it("tidak melempar error kalau total bobot tepat 100", () => {
    expect(() => hitungSkor(inputDasar, BOBOT_SKORING_DEFAULT)).not.toThrow();
  });
});
