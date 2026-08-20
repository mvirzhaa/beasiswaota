import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ambilDaftarPenerimaAktifAdmin,
  ambilBelumLaporAdmin,
} from "@/server/queries/monitoring";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import {
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  FileSpreadsheet,
  PlusCircle,
  ArrowRight,
  } from "lucide-react";

const LABEL_RISIKO: Record<string, string> = {
  AMAN: "Aman",
  PERHATIAN: "Perlu Perhatian",
  KRITIS: "Risiko Kritis",
};

const NADA_RISIKO: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  AMAN: "sukses",
  PERHATIAN: "peringatan",
  KRITIS: "bahaya",
};

export default async function HalamanMonitoringAdmin({
  searchParams,
}: {
  searchParams: Promise<{ periodeId?: string; fakultas?: string }>;
}) {
  const params = await searchParams;

  const periodeList = await prisma.periode.findMany({
    orderBy: { tglBuka: "desc" },
    select: { id: true, kode: true },
  });
  const periodeId = params.periodeId || periodeList[0]?.id;

  if (!periodeId) {
    return (
      <main className="mx-auto mt-6 mb-12 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-1 border-b border-border pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
            <Activity className="h-4 w-4 text-primary" />
            <span>Monitoring Akademik</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
            Monitoring & Evaluasi Mutu Akademik
          </h1>
        </div>
        <p className="mt-8 text-center text-sm text-muted">Belum ada periode semester aktif yang tercatat.</p>
      </main>
    );
  }

  const [penerima, belumLapor] = await Promise.all([
    ambilDaftarPenerimaAktifAdmin(periodeId, params.fakultas || undefined),
    ambilBelumLaporAdmin(periodeId),
  ]);

  const peringatanDini = penerima.filter((p) => p.risiko === "PERHATIAN" || p.risiko === "KRITIS");
  const daftarFakultas = [...new Set(penerima.map((p) => p.fakultas))];

  return (
    <main className="mx-auto mt-6 mb-12 max-w-6xl px-4 sm:px-6">
      {/* Header Halaman & Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
            <Activity className="h-4 w-4 text-primary" />
            <span>Monitoring Akademik</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
            Monitoring & Evaluasi Mahasiswa Penerima
          </h1>
          <p className="text-sm text-muted">
            Deteksi dini risiko penurunan IPK dan pantau kepatuhan pengiriman laporan berkala.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/monitoring/input">
            <Tombol variant="garis" ukuran="sm">
              <PlusCircle className="h-4 w-4" />
              <span>Input Nilai Manual</span>
            </Tombol>
          </Link>
          <Link href="/admin/monitoring/impor">
            <Tombol variant="primer" ukuran="sm">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Impor Data XLSX</span>
            </Tombol>
          </Link>
        </div>
      </div>

      {/* Filter Form */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <form className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Filter Data:</span>
          </span>
          <select
            name="periodeId"
            defaultValue={periodeId}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {periodeList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kode}
              </option>
            ))}
          </select>

          <select
            name="fakultas"
            defaultValue={params.fakultas ?? ""}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Fakultas</option>
            {daftarFakultas.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <Tombol type="submit" variant="primer" ukuran="sm">
            Terapkan Filter
          </Tombol>
        </form>
      </div>

      {/* Warning Cards Grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Peringatan Dini Penurunan IPK */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-950 font-heading font-bold text-base">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Peringatan Dini Akademik ({peringatanDini.length})</span>
          </div>
          <p className="mt-1 text-xs text-amber-800">
            Mahasiswa dengan status risiko PERHATIAN atau KRITIS (IPK di bawah standar kelulusan beasiswa):
          </p>

          <div className="mt-3 divide-y divide-amber-200/60 max-h-48 overflow-y-auto">
            {peringatanDini.map((p) => (
              <div key={p.mahasiswaId} className="flex items-center justify-between py-2 text-xs text-amber-950">
                <div>
                  <span className="font-bold">{p.nama}</span>
                  <span className="ml-1 text-amber-800 font-mono">({p.nim})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">IPK {p.ipk ?? "-"}</span>
                  <Lencana nada={NADA_RISIKO[p.risiko ?? ""] ?? "netral"}>
                    {LABEL_RISIKO[p.risiko ?? ""] ?? p.risiko}
                  </Lencana>
                </div>
              </div>
            ))}
            {peringatanDini.length === 0 && (
              <p className="py-2 text-xs text-amber-800 italic">
                Seluruh mahasiswa penerima beasiswa dalam kategori aman.
              </p>
            )}
          </div>
        </div>

        {/* Peringatan Belum Kirim Laporan */}
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-red-950 font-heading font-bold text-base">
            <Clock className="h-5 w-5 text-red-600" />
            <span>Belum Kirim Laporan ({belumLapor.length})</span>
          </div>
          <p className="mt-1 text-xs text-red-800">
            Mahasiswa yang belum mengunggah laporan perkembangan menjelang batas waktu:
          </p>

          <div className="mt-3 divide-y divide-red-200/60 max-h-48 overflow-y-auto">
            {belumLapor.map((b) => (
              <div key={b.mahasiswaId} className="flex items-center justify-between py-2 text-xs text-red-950">
                <div>
                  <span className="font-bold">{b.nama}</span>
                  <span className="ml-1 text-red-800 font-mono">({b.nim})</span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-red-800 font-mono">
                    Batas: {b.batasKirim.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                  <span className="text-[10px] text-red-700 font-medium uppercase">
                    {b.statusLaporan ?? "Belum dibuat"}
                  </span>
                </div>
              </div>
            ))}
            {belumLapor.length === 0 && (
              <p className="py-2 text-xs text-red-800 italic">
                Semua mahasiswa telah melengkapi laporan perkembangan.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Semua Penerima Aktif */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Semua Penerima Aktif</h2>
            <p className="text-xs text-muted">Total {penerima.length} mahasiswa penerima bantuan aktif</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-3 pl-2">Mahasiswa</th>
                <th className="pb-3">Fakultas / Program Studi</th>
                <th className="pb-3 text-center">IPK</th>
                <th className="pb-3">Status Studi</th>
                <th className="pb-3">Tingkat Risiko</th>
                <th className="pb-3 pr-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {penerima.map((p) => (
                <tr key={p.mahasiswaId} className="transition-colors hover:bg-surface-alt/40">
                  <td className="py-3.5 pl-2">
                    <p className="font-bold text-ink">{p.nama}</p>
                    <p className="text-xs text-muted font-mono">{p.nim}</p>
                  </td>
                  <td className="py-3.5 text-xs text-ink">
                    <span className="font-semibold text-primary">{p.fakultas}</span>
                    <span className="text-muted"> / {p.prodi}</span>
                  </td>
                  <td className="py-3.5 text-center font-mono font-bold text-ink">
                    {p.ipk ?? "-"}
                  </td>
                  <td className="py-3.5 text-xs text-muted">
                    {p.statusAkademik ?? "-"}
                  </td>
                  <td className="py-3.5">
                    {p.risiko ? (
                      <Lencana nada={NADA_RISIKO[p.risiko] ?? "netral"}>
                        {LABEL_RISIKO[p.risiko] ?? p.risiko}
                      </Lencana>
                    ) : (
                      <span className="text-xs text-muted">Belum ada data</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <Link
                      href={`/admin/monitoring/input?mahasiswaId=${p.mahasiswaId}&periodeId=${periodeId}`}
                    >
                      <Tombol variant="garis" ukuran="sm" className="font-semibold">
                        <span>Input Nilai</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Tombol>
                    </Link>
                  </td>
                </tr>
              ))}
              {penerima.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-muted">
                    Tidak ada data penerima aktif pada filter ini.
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
