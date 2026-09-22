import Link from "next/link";
import { ambilDaftarLaporanAdmin } from "@/server/queries/laporan-perkembangan";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import { ClipboardList, ArrowRight, CheckCircle2 } from "lucide-react";

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
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span>Review Akademik</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Review Laporan Perkembangan Mahasiswa
        </h1>
        <p className="mt-0.5 text-xs text-muted sm:text-sm">
          Pemeriksaan laporan capaian IPK dan berkas scan KHS per semester sebelum diverifikasi.
        </p>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {DAFTAR_STATUS.map((s) => {
          const aktif = status === s;
          return (
            <Link
              key={s}
              href={`/admin/laporan?status=${s}`}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                aktif
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface text-muted border border-border hover:bg-surface-alt hover:text-ink"
              }`}
            >
              <span>{LABEL_STATUS_LAPORAN[s]}</span>
            </Link>
          );
        })}
      </div>

      {/* Tabel Laporan */}
      <div className="mt-4 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-surface">
          <div>
            <h2 className="font-heading text-sm font-bold text-ink">Daftar Laporan Perkembangan</h2>
            <p className="text-[11px] text-muted">Menampilkan {daftar.length} berkas ({LABEL_STATUS_LAPORAN[status]})</p>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xs">
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3 pl-5 pr-4">Mahasiswa</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4">Batas Kirim</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 pl-4 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {daftar.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-surface-alt/50">
                  <td className="py-3 pl-5 pr-4">
                    <p className="font-bold text-ink">{l.mahasiswa.nama}</p>
                    <p className="text-[11px] text-muted font-mono">{l.mahasiswa.nim}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink">{l.periode.kode}</td>
                  <td className="py-3 px-4 text-muted font-mono">
                    {l.batasKirim.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-4">
                    <Lencana nada={NADA_STATUS_LAPORAN[l.status] ?? "netral"}>
                      {LABEL_STATUS_LAPORAN[l.status] ?? l.status}
                    </Lencana>
                  </td>
                  <td className="py-3 pl-4 pr-5 text-right">
                    <Link href={`/admin/laporan/${l.id}`}>
                      <Tombol variant="garis" ukuran="sm" className="font-semibold text-xs">
                        <span>Review</span>
                        <ArrowRight className="h-3 w-3" />
                      </Tombol>
                    </Link>
                  </td>
                </tr>
              ))}
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-muted/40 mb-2" />
                    <p className="font-semibold text-ink">Tidak ada laporan pada status ini</p>
                    <p className="text-[11px] text-muted">Semua berkas laporan telah ditinjau.</p>
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
