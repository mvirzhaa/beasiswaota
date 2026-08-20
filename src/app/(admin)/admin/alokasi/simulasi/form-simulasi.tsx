"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Periode } from "@prisma/client";
import { formatRupiah } from "@/lib/uang";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import {
  Shuffle,
  Play,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Coins,
  Wallet,
  TrendingDown,
} from "lucide-react";
import { simulasiAlokasi, eksekusiAlokasi, type HasilSimulasi, type HasilEksekusi } from "../actions";

const STATE_SIMULASI_AWAL: HasilSimulasi = { sukses: false, pesan: "" };
const STATE_EKSEKUSI_AWAL: HasilEksekusi = { sukses: false, pesan: "" };

export function FormSimulasi({ periodeList }: { periodeList: Periode[] }) {
  const [stateSimulasi, actionSimulasi, pendingSimulasi] = useActionState(
    async (_prev: HasilSimulasi, formData: FormData) =>
      simulasiAlokasi(formData.get("periodeId") as string),
    STATE_SIMULASI_AWAL,
  );
  const [stateEksekusi, actionEksekusi, pendingEksekusi] = useActionState(
    async (_prev: HasilEksekusi, formData: FormData) =>
      eksekusiAlokasi(formData.get("periodeId") as string),
    STATE_EKSEKUSI_AWAL,
  );

  if (periodeList.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-xs">
        <p className="text-xs text-muted">
          Belum ada periode semester berstatus <strong>SELEKSI</strong> atau <strong>PENYALURAN</strong> yang siap dialokasikan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Form Eksekusi / Simulasi */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h2 className="font-heading text-lg font-bold text-ink border-b border-border pb-3">
          Konfigurasi Periode Alokasi
        </h2>

        <form className="mt-5 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
            <span>Pilih Periode Semester</span>
            <select
              name="periodeId"
              className="rounded-xl border border-border bg-surface-alt px-3.5 py-2 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {periodeList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.kode} (Status: {p.status})
                </option>
              ))}
            </select>
          </label>

          <Tombol
            type="submit"
            formAction={actionSimulasi}
            disabled={pendingSimulasi || pendingEksekusi}
            variant="garis"
          >
            <Sparkles className="h-4 w-4" />
            <span>{pendingSimulasi ? "Menyimulasikan..." : "Jalankan Simulasi (Uji Coba)"}</span>
          </Tombol>

          <Tombol
            type="submit"
            formAction={actionEksekusi}
            disabled={pendingSimulasi || pendingEksekusi}
            variant="primer"
          >
            <Play className="h-4 w-4" />
            <span>{pendingEksekusi ? "Memproses Batch..." : "Eksekusi Alokasi (Tulis Batch Draft)"}</span>
          </Tombol>
        </form>

        {stateEksekusi.pesan && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-xs ${
              stateEksekusi.sukses
                ? "border border-green-200 bg-green-50 text-green-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {stateEksekusi.sukses ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <div>
              <span>{stateEksekusi.pesan}</span>
              {stateEksekusi.batchId && (
                <Link
                  href={`/admin/alokasi/${stateEksekusi.batchId}`}
                  className="ml-2 font-bold underline hover:text-green-900"
                >
                  Review Batch Sekarang &rarr;
                </Link>
              )}
            </div>
          </div>
        )}

        {stateSimulasi.pesan && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-xs ${
              stateSimulasi.sukses
                ? "border border-green-200 bg-green-50 text-green-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {stateSimulasi.sukses ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{stateSimulasi.pesan}</span>
          </div>
        )}
      </div>

      {/* Hasil Simulasi */}
      {stateSimulasi.rencana && (
        <HasilSimulasiTampil
          rencana={stateSimulasi.rencana}
          mahasiswaMap={stateSimulasi.mahasiswaMap ?? {}}
        />
      )}
    </div>
  );
}

function HasilSimulasiTampil({
  rencana,
  mahasiswaMap,
}: {
  rencana: NonNullable<HasilSimulasi["rencana"]>;
  mahasiswaMap: Record<string, { nama: string; nim: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Metrik Hasil Simulasi */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs text-muted flex items-center justify-between">
            <span>Saldo Pool Awal</span>
            <Wallet className="h-4 w-4 text-muted/60" />
          </span>
          <p className="mt-2 font-mono text-xl font-bold text-ink">
            {formatRupiah(rencana.saldoAwal)}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary-light/40 p-5 shadow-xs">
          <span className="text-xs font-semibold text-primary-dark flex items-center justify-between">
            <span>Total Dialokasikan</span>
            <Coins className="h-4 w-4 text-primary" />
          </span>
          <p className="mt-2 font-mono text-xl font-bold text-primary">
            {formatRupiah(rencana.totalDialokasikan)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs text-muted flex items-center justify-between">
            <span>Saldo Sisa (Digulirkan)</span>
            <TrendingDown className="h-4 w-4 text-muted/60" />
          </span>
          <p className="mt-2 font-mono text-xl font-bold text-ink">
            {formatRupiah(rencana.saldoAkhir)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs text-muted flex items-center justify-between">
            <span>Mode Alokasi</span>
            <Shuffle className="h-4 w-4 text-muted/60" />
          </span>
          <p className="mt-2 font-heading text-lg font-bold text-ink">
            {rencana.mode}
          </p>
        </div>
      </div>

      {/* Tabel Calon Penerima */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-ink">
              Calon Penerima Beasiswa ({rencana.penerima.length} Mahasiswa)
            </h3>
            <p className="text-xs text-muted">Mahasiswa dengan skor prioritas tertinggi yang mencukupi kuota dana</p>
          </div>
          <Lencana nada="sukses">{rencana.penerima.length} Mahasiswa Lolos</Lencana>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-3 pl-2 text-center">Rank</th>
                <th className="pb-3">Mahasiswa</th>
                <th className="pb-3 text-center">Skor Kebutuhan</th>
                <th className="pb-3">Alokasi Bantuan</th>
                <th className="pb-3 pr-2 text-right">Sumber Donasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rencana.penerima.map((p) => (
                <tr key={p.tagihanId} className="transition-colors hover:bg-surface-alt/40">
                  <td className="py-3.5 pl-2 text-center font-bold text-primary font-mono">
                    #{p.ranking}
                  </td>
                  <td className="py-3.5 font-bold text-ink">
                    {mahasiswaMap[p.mahasiswaId]
                      ? `${mahasiswaMap[p.mahasiswaId].nama} (${mahasiswaMap[p.mahasiswaId].nim})`
                      : p.mahasiswaId}
                  </td>
                  <td className="py-3.5 text-center font-mono font-semibold text-ink">
                    {p.skor}
                  </td>
                  <td className="py-3.5 font-mono font-bold text-primary">
                    {formatRupiah(p.nominal)}
                  </td>
                  <td className="py-3.5 pr-2 text-right text-xs text-muted">
                    {p.sumber.length} transaksi transfer
                  </td>
                </tr>
              ))}
              {rencana.penerima.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted">
                    Tidak ada calon penerima yang memenuhi kriteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel Antrean Belum Kebagian */}
      {rencana.antrian.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-ink">
                Antrean Cadangan ({rencana.antrian.length} Mahasiswa)
              </h3>
              <p className="text-xs text-muted">Mahasiswa yang belum tercover karena keterbatasan saldo pool</p>
            </div>
            <Lencana nada="peringatan">{rencana.antrian.length} Menunggu</Lencana>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pl-2 text-center">Rank</th>
                  <th className="pb-3">Mahasiswa</th>
                  <th className="pb-3 text-center">Skor</th>
                  <th className="pb-3">Sisa Tagihan UKT</th>
                  <th className="pb-3 pr-2 text-right">Alasan Belum Tercover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rencana.antrian.map((a) => (
                  <tr key={a.tagihanId} className="transition-colors hover:bg-surface-alt/40">
                    <td className="py-3.5 pl-2 text-center font-bold text-muted font-mono">
                      #{a.ranking}
                    </td>
                    <td className="py-3.5 font-bold text-ink">
                      {mahasiswaMap[a.mahasiswaId]
                        ? `${mahasiswaMap[a.mahasiswaId].nama} (${mahasiswaMap[a.mahasiswaId].nim})`
                        : a.mahasiswaId}
                    </td>
                    <td className="py-3.5 text-center font-mono font-semibold text-ink">
                      {a.skor}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-ink">
                      {formatRupiah(a.sisaTagihan)}
                    </td>
                    <td className="py-3.5 pr-2 text-right text-xs text-muted">
                      {a.alasan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
