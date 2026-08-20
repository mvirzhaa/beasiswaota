"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { catatAudit } from "@/lib/audit";
import { ambilMetaPermintaan } from "@/lib/request-meta";
import { jalankanAlokasi, setujuiBatch, type RencanaAlokasi } from "@/lib/alokasi/engine";
import type { HasilAksi } from "@/types/aksi";

// JANGAN tulis ulang logika di src/lib/alokasi/engine.ts (lihat CLAUDE.md).
// File ini hanya menyambungkan susunRencana/jalankanAlokasi/setujuiBatch yang
// sudah ada ke Server Action + UI.

async function sesiAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Tidak diizinkan");
  }
  return session.user;
}

export interface HasilSimulasi {
  sukses: boolean;
  pesan: string;
  rencana?: RencanaAlokasi;
  mahasiswaMap?: Record<string, { nama: string; nim: string }>;
}

// susunRencana() sengaja hanya mengembalikan mahasiswaId (fungsi murni, tidak
// tahu apa-apa soal tampilan) — nama/nim diambil terpisah di sini supaya UI
// simulasi bisa menunjukkan siapa kandidatnya, tanpa mengubah engine.ts.
async function petakanNamaMahasiswa(
  mahasiswaIds: string[],
): Promise<Record<string, { nama: string; nim: string }>> {
  const daftar = await prisma.mahasiswa.findMany({
    where: { id: { in: mahasiswaIds } },
    select: { id: true, nama: true, nim: true },
  });
  return Object.fromEntries(daftar.map((m) => [m.id, { nama: m.nama, nim: m.nim }]));
}

export async function simulasiAlokasi(periodeId: string): Promise<HasilSimulasi> {
  const admin = await sesiAdmin();
  if (!periodeId) {
    return { sukses: false, pesan: "Pilih periode dulu." };
  }

  try {
    const hasil = await jalankanAlokasi(prisma, {
      periodeId,
      dryRun: true,
      dibuatOlehId: admin.id,
    });
    const idMahasiswa = [
      ...hasil.rencana.penerima.map((p) => p.mahasiswaId),
      ...hasil.rencana.antrian.map((a) => a.mahasiswaId),
    ];
    const mahasiswaMap = await petakanNamaMahasiswa(idMahasiswa);
    return {
      sukses: true,
      pesan: "Simulasi selesai, belum ada yang ditulis ke database.",
      rencana: hasil.rencana,
      mahasiswaMap,
    };
  } catch (error) {
    return { sukses: false, pesan: error instanceof Error ? error.message : "Simulasi gagal." };
  }
}

export interface HasilEksekusi extends HasilAksi {
  batchId?: string;
}

export async function eksekusiAlokasi(periodeId: string): Promise<HasilEksekusi> {
  const admin = await sesiAdmin();
  if (!periodeId) {
    return { sukses: false, pesan: "Pilih periode dulu." };
  }

  // Pengaman di lapisan orkestrasi (bukan mengubah engine.ts): jangan izinkan
  // batch DRAFT baru menumpuk di atas batch DRAFT yang belum diputuskan
  // admin lain, supaya satu tagihan tidak berpotensi kejanji dua kali.
  const batchAktif = await prisma.alokasi.findFirst({
    where: { periodeId, status: "DRAFT" },
    select: { batchId: true },
  });
  if (batchAktif) {
    return {
      sukses: false,
      pesan: `Sudah ada batch DRAFT (${batchAktif.batchId}) untuk periode ini yang belum disetujui/ditolak. Selesaikan batch tersebut dulu.`,
    };
  }

  let hasil;
  try {
    hasil = await jalankanAlokasi(prisma, {
      periodeId,
      dryRun: false,
      dibuatOlehId: admin.id,
    });
  } catch (error) {
    return { sukses: false, pesan: error instanceof Error ? error.message : "Eksekusi gagal." };
  }

  if (!hasil.batchId) {
    return { sukses: true, pesan: "Tidak ada kandidat yang bisa dialokasikan dari saldo saat ini." };
  }

  // jalankanAlokasi() sendiri belum menulis AuditLog untuk pembuatan batch
  // DRAFT (hanya setujuiBatch() yang audited) — dicatat di sini di lapisan
  // Server Action supaya pembuatan batch tetap tertelusuri, tanpa mengubah
  // engine.ts. Perlu didiskusikan apakah ini sebaiknya dipindah ke dalam
  // transaksi jalankanAlokasi sendiri untuk atomisitas penuh.
  const { ipAddress, userAgent } = await ambilMetaPermintaan();
  await catatAudit(prisma, {
    aktorId: admin.id,
    aksi: "alokasi.eksekusi_batch",
    entitas: "alokasi_batch",
    entitasId: hasil.batchId,
    sesudah: {
      periodeId,
      jumlahPenerima: hasil.rencana.penerima.length,
      totalDialokasikan: hasil.rencana.totalDialokasikan.toString(),
    },
    ipAddress,
    userAgent,
  });

  revalidatePath("/admin/alokasi/simulasi");
  return {
    sukses: true,
    pesan: `Batch ${hasil.batchId} dibuat berstatus DRAFT (${hasil.rencana.penerima.length} penerima).`,
    batchId: hasil.batchId,
  };
}

export async function setujuiBatchAlokasi(batchId: string): Promise<HasilAksi> {
  const admin = await sesiAdmin();
  const { ipAddress, userAgent } = await ambilMetaPermintaan();

  try {
    await setujuiBatch(prisma, {
      batchId,
      disetujuiOlehId: admin.id,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });
  } catch (error) {
    return { sukses: false, pesan: error instanceof Error ? error.message : "Gagal menyetujui batch." };
  }

  revalidatePath(`/admin/alokasi/${batchId}`);
  return { sukses: true, pesan: "Batch disetujui, tagihan dan ledger diperbarui." };
}
