import Link from "next/link";
import { prisma } from "@/lib/db";
import { ambilDaftarPengajuanAdmin } from "@/server/queries/pengajuan";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import { FileText, Filter, ArrowRight } from "lucide-react";
import { TombolHitungUlangSkor } from "./hitung-ulang-skor";

type StatusFilter =
  | "DRAFT"
  | "DIAJUKAN"
  | "VERIFIKASI_BERKAS"
  | "DISETUJUI"
  | "DITOLAK"
  | "DIBATALKAN";

const DAFTAR_STATUS: StatusFilter[] = [
  "DRAFT",
  "DIAJUKAN",
  "VERIFIKASI_BERKAS",
  "DISETUJUI",
  "DITOLAK",
  "DIBATALKAN",
];

const LABEL_STATUS_PENGAJUAN: Record<string, string> = {
  DRAFT: "Draft",
  DIAJUKAN: "Diajukan",
  VERIFIKASI_BERKAS: "Verifikasi Berkas",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS_PENGAJUAN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  DRAFT: "netral",
  DIAJUKAN: "info",
  VERIFIKASI_BERKAS: "peringatan",
  DISETUJUI: "sukses",
  DITOLAK: "bahaya",
  DIBATALKAN: "netral",
};

export default async function HalamanDaftarPengajuanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ periodeId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const periodeList = await prisma.periode.findMany({
    orderBy: { tglBuka: "desc" },
    select: { id: true, kode: true },
  });

  const status = DAFTAR_STATUS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : undefined;

  const daftar = await ambilDaftarPengajuanAdmin({
    periodeId: params.periodeId || undefined,
    status,
  });

  return (
    <main className="mx-auto mt-6 mb-12 max-w-6xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <FileText className="h-4 w-4 text-primary" />
          <span>Verifikasi & Seleksi</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Daftar Pengajuan Beasiswa Mahasiswa
        </h1>
        <p className="text-sm text-muted">
          Tinjau berkas pendaftaran, evaluasi penghasilan keluarga, dan kelola status persetujuan beasiswa.
        </p>
      </div>

      {/* Filter & Tombol Hitung Ulang Skor */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <form className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Filter Data:</span>
          </span>
          <select
            name="periodeId"
            defaultValue={params.periodeId ?? ""}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Periode</option>
            {periodeList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kode}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Status</option>
            {DAFTAR_STATUS.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS_PENGAJUAN[s] ?? s}
              </option>
            ))}
          </select>

          <Tombol type="submit" variant="primer" ukuran="sm">
            Terapkan Filter
          </Tombol>
        </form>

        <div>
          <TombolHitungUlangSkor periodeId={params.periodeId || undefined} />
        </div>
      </div>

      {/* Tabel Data Pengajuan */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Data Pengajuan Mahasiswa</h2>
            <p className="text-xs text-muted">Total {daftar.length} permohonan ditemukan</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-3 pl-2">Mahasiswa</th>
                <th className="pb-3">Periode</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-center">Skor Kebutuhan</th>
                <th className="pb-3">Validasi Berkas</th>
                <th className="pb-3 pr-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {daftar.map((p) => {
                const validCount = p.berkas.filter((b) => b.status === "VALID").length;
                const totalBerkas = p.berkas.length;

                return (
                  <tr key={p.id} className="transition-colors hover:bg-surface-alt/40">
                    <td className="py-3.5 pl-2">
                      <p className="font-bold text-ink">{p.mahasiswa.nama}</p>
                      <p className="text-xs text-muted font-mono">{p.mahasiswa.nim}</p>
                    </td>
                    <td className="py-3.5 font-medium text-ink">{p.periode.kode}</td>
                    <td className="py-3.5">
                      <Lencana nada={NADA_STATUS_PENGAJUAN[p.status] ?? "netral"}>
                        {LABEL_STATUS_PENGAJUAN[p.status] ?? p.status}
                      </Lencana>
                    </td>
                    <td className="py-3.5 text-center font-mono font-bold text-primary">
                      {p.skor ? p.skor.toString() : "-"}
                    </td>
                    <td className="py-3.5 text-xs text-muted">
                      <span className={validCount === totalBerkas && totalBerkas > 0 ? "font-semibold text-green-700" : ""}>
                        {validCount}/{totalBerkas} Berkas Valid
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <Link href={`/admin/pengajuan/${p.id}`}>
                        <Tombol variant="garis" ukuran="sm" className="font-semibold">
                          <span>Review</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Tombol>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-muted">
                    Tidak ada data pengajuan yang sesuai dengan kriteria filter.
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
