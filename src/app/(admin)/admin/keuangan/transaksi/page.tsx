import Link from "next/link";
import { formatRupiah } from "@/lib/uang";
import { ambilDaftarTransaksiAdmin } from "@/server/queries/transaksi";
import { Tombol } from "@/components/ui/tombol";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type StatusFilter = "MENUNGGU_VERIFIKASI" | "TERVERIFIKASI" | "DITOLAK" | "DIKEMBALIKAN";

const DAFTAR_STATUS: StatusFilter[] = [
  "MENUNGGU_VERIFIKASI",
  "TERVERIFIKASI",
  "DITOLAK",
  "DIKEMBALIKAN",
];

const LABEL_STATUS_TRANSAKSI: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  TERVERIFIKASI: "Terverifikasi (Sah)",
  DITOLAK: "Ditolak",
  DIKEMBALIKAN: "Dikembalikan",
};

export default async function HalamanTransaksiAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = DAFTAR_STATUS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "MENUNGGU_VERIFIKASI";

  const daftar = await ambilDaftarTransaksiAdmin({ status });

  return (
    <div>
      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {DAFTAR_STATUS.map((s) => {
          const aktif = status === s;
          return (
            <Link
              key={s}
              href={`/admin/keuangan/transaksi?status=${s}`}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                aktif
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface text-muted border border-border hover:bg-surface-alt hover:text-ink"
              }`}
            >
              <span>{LABEL_STATUS_TRANSAKSI[s]}</span>
            </Link>
          );
        })}
      </div>

      {/* Tabel Transaksi */}
      <div className="mt-4 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-surface">
          <div>
            <h2 className="font-heading text-sm font-bold text-ink">Daftar Transaksi</h2>
            <p className="text-[11px] text-muted">Menampilkan {daftar.length} data ({LABEL_STATUS_TRANSAKSI[status]})</p>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xs">
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3 pl-5 pr-4">Donatur / Munfiq</th>
                <th className="py-3 px-4">Nominal Masuk</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Tanggal Bayar</th>
                <th className="py-3 px-4">Peruntukan</th>
                <th className="py-3 pl-4 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {daftar.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-surface-alt/50">
                  <td className="py-3 pl-5 pr-4 font-bold text-ink">
                    {t.ortuAsuh.atasNamaMunfiq || t.ortuAsuh.nama}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {formatRupiah(t.nominal)}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    <span className="rounded-md bg-surface-alt px-2 py-0.5 font-medium text-ink">
                      {t.metode.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-muted">
                    {t.tglBayar.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {t.jadwalBayar
                      ? `${t.jadwalBayar.periode.kode} (#${t.jadwalBayar.urutan})`
                      : "Donasi Bebas / Non-Jadwal"}
                  </td>
                  <td className="py-3 pl-4 pr-5 text-right">
                    <Link href={`/admin/keuangan/transaksi/${t.id}`}>
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
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-muted/40 mb-2" />
                    <p className="font-semibold text-ink">Tidak ada transaksi pada status ini</p>
                    <p className="text-[11px] text-muted">Semua mutasi transaksi telah tertangani.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
