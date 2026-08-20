import { describe, expect, it } from "vitest";
import { generateJadwal } from "./jadwal";

const periodeAwal = { tglBuka: new Date(Date.UTC(2026, 7, 1)) }; // 2026-08-01

describe("generateJadwal", () => {
  it("8 semester ritme PER_PERIODE menghasilkan 8 baris, satu per periode", () => {
    const baris = generateJadwal(
      { jumlahPeriode: 8, ritme: "PER_PERIODE", nominalPerPeriode: 5_000_000n },
      periodeAwal,
    );
    expect(baris).toHaveLength(8);
    expect(baris.every((b) => b.urutan === 1)).toBe(true);
    expect(baris.every((b) => b.nominal === 5_000_000n)).toBe(true);
    expect(baris.map((b) => b.kePeriode)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("1 semester ritme PER_BULAN menghasilkan 6 baris, total persis nominalPerPeriode", () => {
    const nominalPerPeriode = 6_000_000n;
    const baris = generateJadwal(
      { jumlahPeriode: 1, ritme: "PER_BULAN", nominalPerPeriode },
      periodeAwal,
    );
    expect(baris).toHaveLength(6);
    expect(baris.map((b) => b.urutan)).toEqual([1, 2, 3, 4, 5, 6]);
    const total = baris.reduce((acc, b) => acc + b.nominal, 0n);
    expect(total).toBe(nominalPerPeriode);
  });

  it("nominal yang tidak habis dibagi 6 menaruh sisanya di cicilan terakhir, bukan dibulatkan tiap baris", () => {
    const nominalPerPeriode = 4_500_001n;
    const baris = generateJadwal(
      { jumlahPeriode: 1, ritme: "PER_BULAN", nominalPerPeriode },
      periodeAwal,
    );
    expect(baris.slice(0, 5).every((b) => b.nominal === 750_000n)).toBe(true);
    expect(baris[5].nominal).toBe(750_001n);
    const total = baris.reduce((acc, b) => acc + b.nominal, 0n);
    expect(total).toBe(nominalPerPeriode);
  });

  it("2 semester ritme PER_BULAN menghasilkan 12 baris (6 per periode)", () => {
    const baris = generateJadwal(
      { jumlahPeriode: 2, ritme: "PER_BULAN", nominalPerPeriode: 3_000_000n },
      periodeAwal,
    );
    expect(baris).toHaveLength(12);
    expect(baris.filter((b) => b.kePeriode === 1)).toHaveLength(6);
    expect(baris.filter((b) => b.kePeriode === 2)).toHaveLength(6);
  });

  it("periode pertama memakai persis periodeAwal.tglBuka sebagai jatuh tempo (PER_PERIODE)", () => {
    const baris = generateJadwal(
      { jumlahPeriode: 1, ritme: "PER_PERIODE", nominalPerPeriode: 1_000_000n },
      periodeAwal,
    );
    expect(baris[0].jatuhTempo.getTime()).toBe(periodeAwal.tglBuka.getTime());
  });

  it("jatuh tempo periode berikutnya bergeser 6 bulan dari periode sebelumnya", () => {
    const baris = generateJadwal(
      { jumlahPeriode: 2, ritme: "PER_PERIODE", nominalPerPeriode: 1_000_000n },
      periodeAwal,
    );
    expect(baris[1].jatuhTempo.getUTCFullYear()).toBe(2027);
    expect(baris[1].jatuhTempo.getUTCMonth()).toBe(1); // Februari (0-based)
  });

  it("deterministik untuk input yang sama", () => {
    const input = { jumlahPeriode: 3, ritme: "PER_BULAN" as const, nominalPerPeriode: 9_000_007n };
    const hasil1 = generateJadwal(input, periodeAwal);
    const hasil2 = generateJadwal(input, periodeAwal);
    expect(hasil2).toEqual(hasil1);
  });
});
