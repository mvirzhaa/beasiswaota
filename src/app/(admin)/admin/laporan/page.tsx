import Link from "next/link";
import { ambilDaftarLaporanAdmin } from "@/server/queries/laporan-perkembangan";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import { ClipboardList, Filter, ArrowRight } from "lucide-react";

type StatusFilter = "DRAFT" | "DIKIRIM" | "PERLU_REVISI" | "DIVERIFIKASI";
const DAFTAR_STATUS: StatusFilter[] = ["DRAFT", "DIKIRIM", "PERLU_REVISI", "DIVERIFIKASI"];

const LABEL_STATUS_LAPORAN: Record<string, string> = {
  DRAFT: "Draft",
  DIKIRIM: "Dikirim (Menunggu Review)",
  PERLU_REVISI: "Perlu Revisi",
  DIVERIFIKASI: "Diverifikasi (Sah)",
};

const NADA_STATUS_LAPORAN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  DRAFT: "netral",
  DIKIRIM: "peringatan",
  PERLU_REVISI: "bahaya",
  DIVERIFIKASI: "sukses",
};

export default async function HalamanLaporanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = DAFTAR_STATUS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "DIKIRIM";

  const daftar = await ambilDaftarLaporanAdmin({ status });

  return (
    <main className="mx-auto mt-6 mb-12 max-w-6xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span>Review Akademik</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Review Laporan Perkembangan Mahasiswa
        </h1>
        <p className="text-sm text-muted">
          Pemeriksaan laporan capaian IPK dan berkas scan KHS per semester sebelum diverifikasi.
        </p>
      </div>

      {/* Filter Status */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <form className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Status Laporan:</span>
          </span>
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {DAFTAR_STATUS.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS_LAPORAN[s] ?? s}
              </option>
            ))}
          </select>
          <Tombol type="submit" variant="primer" ukuran="sm">
            Terapkan Filter
          </Tombol>
        </form>
      </div>

      {/* Tabel Laporan */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Daftar Laporan Perkembangan</h2>
            <p className="text-xs text-muted">Ditemukan {daftar.length} berkas laporan</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-3 pl-2">Mahasiswa</th>
                <th className="pb-3">Periode</th>
                <th className="pb-3">Batas Kirim</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {daftar.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-surface-alt/40">
                  <td className="py-3.5 pl-2">
                    <p className="font-bold text-ink">{l.mahasiswa.nama}</p>
                    <p className="text-xs text-muted font-mono">{l.mahasiswa.nim}</p>
                  </td>
                  <td className="py-3.5 font-medium text-ink">{l.periode.kode}</td>
                  <td className="py-3.5 text-xs text-muted font-mono">
                    {l.batasKirim.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3.5">
                    <Lencana nada={NADA_STATUS_LAPORAN[l.status] ?? "netral"}>
                      {LABEL_STATUS_LAPORAN[l.status] ?? l.status}
                    </Lencana>
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <Link href={`/admin/laporan/${l.id}`}>
                      <Tombol variant="garis" ukuran="sm" className="font-semibold">
                        <span>Review Laporan</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Tombol>
                    </Link>
                  </td>
                </tr>
              ))}
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-muted">
                    Tidak ada laporan pada status ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
