import { describe, expect, it } from "vitest";
import {
  susunRencana,
  type KandidatAlokasi,
  type SusunRencanaInput,
  type TransaksiTersedia,
} from "./engine";

function kandidat(
  tagihanId: string,
  sisaTagihan: bigint,
  skor: number,
  createdAt = new Date("2026-01-01"),
): KandidatAlokasi {
  return { tagihanId, mahasiswaId: `mhs-${tagihanId}`, sisaTagihan, skor, createdAt };
}

function transaksi(
  transaksiId: string,
  sisaNominal: bigint,
  tglBayar: Date,
): TransaksiTersedia {
  return { transaksiId, sisaNominal, tglBayar };
}

describe("susunRencana", () => {
  it("saldo persis pas untuk N mahasiswa menghasilkan tepat N penerima dan saldo akhir nol", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 3_000_000n,
      kandidat: [
        kandidat("t1", 1_000_000n, 90),
        kandidat("t2", 1_000_000n, 80),
        kandidat("t3", 1_000_000n, 70),
      ],
      transaksiTersedia: [transaksi("tr1", 3_000_000n, new Date("2026-01-01"))],
    };

    const hasil = susunRencana(input);

    expect(hasil.penerima).toHaveLength(3);
    expect(hasil.saldoAkhir).toBe(0n);
    expect(hasil.totalDialokasikan).toBe(3_000_000n);
    expect(hasil.antrian).toHaveLength(0);
  });

  it("saldo kurang satu rupiah dari kandidat teratas: KUOTA_TUNTAS melewatinya dan mencoba kandidat berikutnya", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 999_999n,
      kandidat: [
        kandidat("t1", 1_000_000n, 90), // butuh 1 rupiah lebih dari saldo
        kandidat("t2", 500_000n, 80), // cukup
      ],
      transaksiTersedia: [transaksi("tr1", 999_999n, new Date("2026-01-01"))],
    };

    const hasil = susunRencana(input);

    expect(hasil.penerima).toHaveLength(1);
    expect(hasil.penerima[0].tagihanId).toBe("t2");
    expect(hasil.antrian).toHaveLength(1);
    expect(hasil.antrian[0].tagihanId).toBe("t1");
    expect(hasil.antrian[0].alasan).toBe("SALDO_TIDAK_CUKUP");
    expect(hasil.saldoAkhir).toBe(499_999n);
  });

  it("satu transaksi terpecah ke tiga mahasiswa, jumlah AlokasiSumber sama dengan nominal transaksi", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 3_000_000n,
      kandidat: [
        kandidat("t1", 1_000_000n, 90),
        kandidat("t2", 1_000_000n, 80),
        kandidat("t3", 1_000_000n, 70),
      ],
      transaksiTersedia: [transaksi("tr1", 3_000_000n, new Date("2026-01-01"))],
    };

    const hasil = susunRencana(input);

    const totalSumber = hasil.penerima
      .flatMap((p) => p.sumber)
      .filter((s) => s.transaksiId === "tr1")
      .reduce((acc, s) => acc + s.nominal, 0n);

    expect(totalSumber).toBe(3_000_000n);
  });

  it("dua kali run dengan data identik menghasilkan urutan penerima identik", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 2_000_000n,
      kandidat: [
        kandidat("t1", 1_000_000n, 80, new Date("2026-01-02")),
        kandidat("t2", 1_000_000n, 80, new Date("2026-01-01")),
      ],
      transaksiTersedia: [transaksi("tr1", 2_000_000n, new Date("2026-01-01"))],
    };

    const hasil1 = susunRencana(input);
    const hasil2 = susunRencana(input);

    expect(hasil1.penerima.map((p) => p.tagihanId)).toEqual(
      hasil2.penerima.map((p) => p.tagihanId),
    );
    // Skor sama -> tie-break createdAt: t2 (lebih awal) harus didahulukan.
    expect(hasil1.penerima.map((p) => p.tagihanId)).toEqual(["t2", "t1"]);
  });

  it("total AlokasiSumber per transaksi tidak pernah melebihi nominal transaksi", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 1_500_000n,
      kandidat: [kandidat("t1", 1_500_000n, 90)],
      transaksiTersedia: [
        transaksi("tr1", 1_000_000n, new Date("2026-01-01")),
        transaksi("tr2", 500_000n, new Date("2026-01-02")),
      ],
    };

    const hasil = susunRencana(input);
    const dariTr1 = hasil.penerima[0].sumber.find((s) => s.transaksiId === "tr1");
    const dariTr2 = hasil.penerima[0].sumber.find((s) => s.transaksiId === "tr2");

    expect(dariTr1?.nominal).toBe(1_000_000n);
    expect(dariTr2?.nominal).toBe(500_000n);
  });

  it("saldo pool tidak pernah negatif", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 500_000n,
      kandidat: [kandidat("t1", 1_000_000n, 90)],
      transaksiTersedia: [transaksi("tr1", 500_000n, new Date("2026-01-01"))],
    };

    const hasil = susunRencana(input);

    expect(hasil.saldoAkhir).toBeGreaterThanOrEqual(0n);
    expect(hasil.saldoAkhir).toBe(500_000n);
    expect(hasil.penerima).toHaveLength(0);
    expect(hasil.antrian).toHaveLength(1);
  });

  it("melempar error kalau saldoPool tidak konsisten dengan total transaksiTersedia", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 1_000_000n,
      kandidat: [],
      transaksiTersedia: [transaksi("tr1", 900_000n, new Date("2026-01-01"))],
    };

    expect(() => susunRencana(input)).toThrow();
  });

  it("kandidat dengan sisaTagihan nol tidak dialokasikan dan tidak masuk antrian", () => {
    const input: SusunRencanaInput = {
      periodeId: "p1",
      saldoPool: 0n,
      kandidat: [kandidat("t1", 0n, 90)],
      transaksiTersedia: [],
    };

    const hasil = susunRencana(input);

    expect(hasil.penerima).toHaveLength(0);
    expect(hasil.antrian).toHaveLength(0);
  });
});
