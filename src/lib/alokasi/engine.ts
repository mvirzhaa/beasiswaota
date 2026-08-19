import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { catatAudit } from "../audit";

// ============================================================================
// Mesin alokasi — Sistem Beasiswa Orangtua Asuh UIKA.
//
// JANGAN TULIS ULANG LOGIKA DI FILE INI TANPA KONFIRMASI (lihat CLAUDE.md).
// Kalau ada yang tampak perlu diubah, jelaskan dulu apa dan kenapa.
//
// susunRencana() adalah fungsi murni: tidak menyentuh database, tidak
// menghasilkan efek samping, deterministik untuk input yang sama. Simulasi
// (dryRun) dan eksekusi sungguhan WAJIB memanggil fungsi yang sama ini —
// satu-satunya beda adalah apakah hasilnya ditulis ke database atau tidak.
// ============================================================================

export type ModeAlokasi = "KUOTA_TUNTAS";

export interface KandidatAlokasi {
  tagihanId: string;
  mahasiswaId: string;
  /** Sisa tagihan yang belum terbayar, dalam Rupiah penuh. */
  sisaTagihan: bigint;
  /** Skor kelayakan (lihat src/lib/skoring/kelayakan.ts), lebih tinggi = lebih prioritas. */
  skor: number;
  /**
   * Kunci tie-break saat skor identik. Harus stabil dan unik, mis. tagihanId
   * itu sendiri, supaya urutan penerima selalu identik pada input identik.
   */
  createdAt: Date;
}

export interface TransaksiTersedia {
  transaksiId: string;
  /** Sisa nominal transaksi yang belum dialokasikan ke mahasiswa manapun. */
  sisaNominal: bigint;
  /** Dipakai untuk urutan FIFO — transaksi terverifikasi tertua dipakai dulu. */
  tglBayar: Date;
}

export interface SusunRencanaInput {
  periodeId: string;
  /** Saldo pool periode ini, harus sama dengan SUM(transaksiTersedia.sisaNominal). */
  saldoPool: bigint;
  kandidat: KandidatAlokasi[];
  transaksiTersedia: TransaksiTersedia[];
  mode?: ModeAlokasi;
}

export interface RincianSumberDana {
  transaksiId: string;
  nominal: bigint;
}

export interface HasilAlokasiKandidat {
  tagihanId: string;
  mahasiswaId: string;
  nominal: bigint;
  ranking: number;
  skor: number;
  sumber: RincianSumberDana[];
}

export interface AntrianTertunda {
  tagihanId: string;
  mahasiswaId: string;
  sisaTagihan: bigint;
  ranking: number;
  skor: number;
  alasan: "SALDO_TIDAK_CUKUP";
}

export interface RencanaAlokasi {
  periodeId: string;
  mode: ModeAlokasi;
  saldoAwal: bigint;
  saldoAkhir: bigint;
  totalDialokasikan: bigint;
  penerima: HasilAlokasiKandidat[];
  antrian: AntrianTertunda[];
}

/**
 * Susun rencana alokasi dana pool ke kandidat penerima. Fungsi murni —
 * tidak membaca/menulis database, aman dipanggil berkali-kali dengan input
 * sama dan akan selalu menghasilkan output identik.
 *
 * Mode KUOTA_TUNTAS: kandidat hanya didanai kalau saldo pool yang tersisa
 * cukup untuk melunasi sisaTagihan-nya secara penuh. Kalau tidak cukup,
 * kandidat itu dilewati (masuk antrian) dan mesin mencoba kandidat
 * berikutnya — supaya dana tidak mengendap hanya karena kandidat teratas
 * butuh lebih dari saldo yang ada.
 */
export function susunRencana(input: SusunRencanaInput): RencanaAlokasi {
  const mode = input.mode ?? "KUOTA_TUNTAS";
  const saldoAwal = input.saldoPool;

  const totalTransaksi = input.transaksiTersedia.reduce(
    (acc, t) => acc + t.sisaNominal,
    0n,
  );
  if (totalTransaksi !== saldoAwal) {
    throw new Error(
      `saldoPool (${saldoAwal}) tidak sama dengan total transaksiTersedia (${totalTransaksi})`,
    );
  }

  // Urutkan kandidat: skor tertinggi dulu, tie-break pakai createdAt lalu
  // tagihanId supaya urutan selalu deterministik walau skor & waktu sama persis.
  const kandidatTerurut = [...input.kandidat].sort((a, b) => {
    if (b.skor !== a.skor) return b.skor - a.skor;
    const beda = a.createdAt.getTime() - b.createdAt.getTime();
    if (beda !== 0) return beda;
    return a.tagihanId < b.tagihanId ? -1 : a.tagihanId > b.tagihanId ? 1 : 0;
  });

  // Transaksi FIFO: tertua dulu, tie-break transaksiId supaya deterministik.
  const kolamTransaksi = input.transaksiTersedia
    .map((t) => ({ ...t }))
    .sort((a, b) => {
      const beda = a.tglBayar.getTime() - b.tglBayar.getTime();
      if (beda !== 0) return beda;
      return a.transaksiId < b.transaksiId
        ? -1
        : a.transaksiId > b.transaksiId
          ? 1
          : 0;
    });

  let saldoTersisa = saldoAwal;
  const penerima: HasilAlokasiKandidat[] = [];
  const antrian: AntrianTertunda[] = [];

  kandidatTerurut.forEach((kandidat, index) => {
    const ranking = index + 1;

    if (mode === "KUOTA_TUNTAS" && kandidat.sisaTagihan > saldoTersisa) {
      antrian.push({
        tagihanId: kandidat.tagihanId,
        mahasiswaId: kandidat.mahasiswaId,
        sisaTagihan: kandidat.sisaTagihan,
        ranking,
        skor: kandidat.skor,
        alasan: "SALDO_TIDAK_CUKUP",
      });
      return;
    }

    if (kandidat.sisaTagihan === 0n) {
      return;
    }

    const sumber = ambilDariKolamFifo(kolamTransaksi, kandidat.sisaTagihan);
    saldoTersisa -= kandidat.sisaTagihan;

    penerima.push({
      tagihanId: kandidat.tagihanId,
      mahasiswaId: kandidat.mahasiswaId,
      nominal: kandidat.sisaTagihan,
      ranking,
      skor: kandidat.skor,
      sumber,
    });
  });

  const totalDialokasikan = penerima.reduce((acc, p) => acc + p.nominal, 0n);

  return {
    periodeId: input.periodeId,
    mode,
    saldoAwal,
    saldoAkhir: saldoTersisa,
    totalDialokasikan,
    penerima,
    antrian,
  };
}

/**
 * Ambil `nominal` dari kolam transaksi FIFO (mutasi in-place kolamTransaksi),
 * pecah ke beberapa transaksi bila satu transaksi tidak cukup. Melempar
 * error kalau kolam tidak cukup — pemanggil wajib memastikan saldoPool
 * konsisten dengan total transaksiTersedia sebelum memanggil ini.
 */
function ambilDariKolamFifo(
  kolamTransaksi: TransaksiTersedia[],
  nominal: bigint,
): RincianSumberDana[] {
  let sisaDibutuhkan = nominal;
  const sumber: RincianSumberDana[] = [];

  for (const transaksi of kolamTransaksi) {
    if (sisaDibutuhkan === 0n) break;
    if (transaksi.sisaNominal <= 0n) continue;

    const ambil =
      transaksi.sisaNominal < sisaDibutuhkan
        ? transaksi.sisaNominal
        : sisaDibutuhkan;

    transaksi.sisaNominal -= ambil;
    sisaDibutuhkan -= ambil;
    sumber.push({ transaksiId: transaksi.transaksiId, nominal: ambil });
  }

  if (sisaDibutuhkan !== 0n) {
    throw new Error(
      `Kolam transaksi tidak cukup untuk mendanai ${nominal}, kurang ${sisaDibutuhkan}`,
    );
  }

  return sumber;
}

// ============================================================================
// Orkestrasi — bagian ini MENYENTUH DATABASE. susunRencana() di atas tetap
// murni; fungsi-fungsi di bawah hanya membaca state, memanggil susunRencana,
// lalu (kalau bukan dryRun) menuliskan hasilnya.
//
// Disambungkan ke Server Action pada Sesi 6 — lihat ARSITEKTUR.md.
// ============================================================================

type TxClient = Prisma.TransactionClient;

export interface JalankanAlokasiOpsi {
  periodeId: string;
  dryRun: boolean;
  dibuatOlehId: string;
  mode?: ModeAlokasi;
}

export interface JalankanAlokasiHasil {
  rencana: RencanaAlokasi;
  batchId: string | null;
}

/**
 * Baca saldo pool + kandidat dari database, susun rencana, dan (kalau
 * dryRun === false) tulis hasilnya sebagai batch Alokasi berstatus DRAFT.
 * dryRun === true dipakai untuk halaman simulasi, tidak menulis apa pun.
 */
export async function jalankanAlokasi(
  db: PrismaClient,
  opsi: JalankanAlokasiOpsi,
): Promise<JalankanAlokasiHasil> {
  const jalankan = async (tx: TxClient): Promise<JalankanAlokasiHasil> => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(4711, hashtext(${opsi.periodeId}))`;

    const [transaksiTerverifikasi, kandidat] = await Promise.all([
      ambilTransaksiTersediaFifo(tx, opsi.periodeId),
      ambilKandidatBelumLunas(tx, opsi.periodeId),
    ]);

    const saldoPool = transaksiTerverifikasi.reduce(
      (acc, t) => acc + t.sisaNominal,
      0n,
    );

    const rencana = susunRencana({
      periodeId: opsi.periodeId,
      saldoPool,
      kandidat,
      transaksiTersedia: transaksiTerverifikasi,
      mode: opsi.mode,
    });

    if (opsi.dryRun) {
      return { rencana, batchId: null };
    }

    if (rencana.penerima.length === 0) {
      return { rencana, batchId: null };
    }

    const batchId = randomUUID();

    for (const hasil of rencana.penerima) {
      await tx.alokasi.create({
        data: {
          periodeId: opsi.periodeId,
          tagihanId: hasil.tagihanId,
          nominal: hasil.nominal,
          status: "DRAFT",
          metode: "OTOMATIS",
          batchId,
          dibuatOlehId: opsi.dibuatOlehId,
          alasanPrioritas: {
            ranking: hasil.ranking,
            skor: hasil.skor,
            mode: rencana.mode,
          },
          sumber: {
            create: hasil.sumber.map((s) => ({
              transaksiId: s.transaksiId,
              nominal: s.nominal,
            })),
          },
        },
      });
    }

    return { rencana, batchId };
  };

  return db.$transaction(jalankan);
}

/**
 * Transaksi tidak punya periodeId langsung di schema — keanggotaan pool per
 * periode ditentukan lewat baris KREDIT di DanaLedger yang dibuat saat
 * transaksi diverifikasi (Sesi 5). Konsumsi dana (AlokasiSumber) juga
 * disaring lewat Alokasi.periodeId supaya sisa saldo tidak tercampur
 * antar periode untuk transaksi yang (secara desain) hanya boleh
 * dikreditkan ke satu periode.
 */
async function ambilTransaksiTersediaFifo(
  tx: TxClient,
  periodeId: string,
): Promise<TransaksiTersedia[]> {
  const kredit = await tx.danaLedger.findMany({
    where: { periodeId, tipe: "KREDIT", transaksiId: { not: null } },
    include: { transaksi: true },
  });

  const hasil: TransaksiTersedia[] = [];
  for (const baris of kredit) {
    if (!baris.transaksi) continue;

    const terpakai = await tx.alokasiSumber.aggregate({
      where: { transaksiId: baris.transaksi.id, alokasi: { periodeId } },
      _sum: { nominal: true },
    });

    const sisaNominal = baris.nominal - (terpakai._sum.nominal ?? 0n);
    if (sisaNominal > 0n) {
      hasil.push({
        transaksiId: baris.transaksi.id,
        sisaNominal,
        tglBayar: baris.transaksi.tglBayar,
      });
    }
  }

  return hasil;
}

async function ambilKandidatBelumLunas(
  tx: TxClient,
  periodeId: string,
): Promise<KandidatAlokasi[]> {
  const tagihan = await tx.tagihan.findMany({
    where: {
      periodeId,
      status: { in: ["BELUM_LUNAS", "LUNAS_SEBAGIAN"] },
    },
    include: {
      mahasiswa: {
        include: {
          pengajuan: { where: { periodeId }, take: 1 },
        },
      },
    },
  });

  return tagihan.map((t) => {
    const pengajuan = t.mahasiswa.pengajuan[0];
    return {
      tagihanId: t.id,
      mahasiswaId: t.mahasiswaId,
      sisaTagihan: t.nominal - t.terbayar,
      skor: pengajuan?.skor ? Number(pengajuan.skor) : 0,
      createdAt: t.createdAt,
    };
  });
}

export interface SetujuiBatchOpsi {
  batchId: string;
  disetujuiOlehId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Satu-satunya jalur yang boleh mengubah Tagihan.terbayar (aturan keras #3).
 * Maker-checker: penyetuju wajib berbeda dari yang mengeksekusi batch
 * (Alokasi.dibuatOlehId) — lihat aturan keras #8.
 */
export async function setujuiBatch(
  db: PrismaClient,
  opsi: SetujuiBatchOpsi,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const alokasiBatch = await tx.alokasi.findMany({
      where: { batchId: opsi.batchId, status: "DRAFT" },
      include: { tagihan: true },
    });

    if (alokasiBatch.length === 0) {
      throw new Error(`Batch ${opsi.batchId} tidak ditemukan atau sudah diproses`);
    }

    const periodeId = alokasiBatch[0].periodeId;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(4711, hashtext(${periodeId}))`;

    for (const alokasi of alokasiBatch) {
      if (alokasi.dibuatOlehId && alokasi.dibuatOlehId === opsi.disetujuiOlehId) {
        throw new Error(
          "Penyetuju tidak boleh sama dengan pelaksana eksekusi batch (maker-checker)",
        );
      }
    }

    for (const alokasi of alokasiBatch) {
      const tagihanSebelum = alokasi.tagihan;
      const terbayarBaru = tagihanSebelum.terbayar + alokasi.nominal;
      const statusBaru =
        terbayarBaru >= tagihanSebelum.nominal ? "LUNAS" : "LUNAS_SEBAGIAN";

      await tx.tagihan.update({
        where: { id: tagihanSebelum.id },
        data: { terbayar: terbayarBaru, status: statusBaru },
      });

      const ledgerTerakhir = await tx.danaLedger.findFirst({
        where: { periodeId },
        orderBy: { createdAt: "desc" },
      });
      const saldoSebelum = ledgerTerakhir?.saldoSetelah ?? 0n;
      const saldoSetelah = saldoSebelum - alokasi.nominal;

      await tx.danaLedger.create({
        data: {
          periodeId,
          tipe: "DEBIT",
          nominal: alokasi.nominal,
          saldoSetelah,
          alokasiId: alokasi.id,
          keterangan: `Alokasi ke tagihan ${tagihanSebelum.id} (batch ${opsi.batchId})`,
        },
      });

      await tx.alokasi.update({
        where: { id: alokasi.id },
        data: {
          status: "DISETUJUI",
          disetujuiOlehId: opsi.disetujuiOlehId,
          disetujuiAt: new Date(),
        },
      });

      await catatAudit(tx, {
        aktorId: opsi.disetujuiOlehId,
        aksi: "alokasi.setujui",
        entitas: "tagihan",
        entitasId: tagihanSebelum.id,
        sebelum: {
          terbayar: tagihanSebelum.terbayar.toString(),
          status: tagihanSebelum.status,
        },
        sesudah: { terbayar: terbayarBaru.toString(), status: statusBaru },
        ipAddress: opsi.ipAddress,
        userAgent: opsi.userAgent,
      });
    }
  });
}

export interface BarisLaporanPenyaluran {
  mahasiswaId: string;
  namaTampilan: string;
  prodi: string;
  totalDisalurkan: bigint;
  jumlahAlokasi: number;
}

/**
 * Laporan penyaluran untuk donatur: dari mana rupiahnya berasal, ke siapa
 * saja tersebar (lewat AlokasiSumber), TANPA menyiratkan kepemilikan —
 * ini murni transparansi arus dana, bukan dasar RelasiAsuh.
 */
export async function laporanPenyaluran(
  db: PrismaClient,
  ortuAsuhId: string,
  periodeId?: string,
): Promise<BarisLaporanPenyaluran[]> {
  const sumberDana = await db.alokasiSumber.findMany({
    where: {
      transaksi: { ortuAsuhId },
      ...(periodeId ? { alokasi: { periodeId } } : {}),
    },
    include: {
      alokasi: {
        include: { tagihan: { include: { mahasiswa: true } } },
      },
    },
  });

  const perMahasiswa = new Map<string, BarisLaporanPenyaluran>();

  for (const baris of sumberDana) {
    const mahasiswa = baris.alokasi.tagihan.mahasiswa;
    const existing = perMahasiswa.get(mahasiswa.id);
    if (existing) {
      existing.totalDisalurkan += baris.nominal;
      existing.jumlahAlokasi += 1;
    } else {
      perMahasiswa.set(mahasiswa.id, {
        mahasiswaId: mahasiswa.id,
        namaTampilan: inisialNama(mahasiswa.nama),
        prodi: mahasiswa.prodi,
        totalDisalurkan: baris.nominal,
        jumlahAlokasi: 1,
      });
    }
  }

  return [...perMahasiswa.values()];
}

function inisialNama(nama: string): string {
  const bagian = nama.trim().split(/\s+/);
  const inisial = bagian.map((kata) => `${kata[0]?.toUpperCase() ?? ""}.`).join("");
  return inisial || "-";
}
