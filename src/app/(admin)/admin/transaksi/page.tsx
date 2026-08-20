import Link from "next/link";
import { formatRupiah } from "@/lib/uang";
import { ambilDaftarTransaksiAdmin } from "@/server/queries/transaksi";
import { Tombol } from "@/components/ui/tombol";
import { Receipt, Filter, ArrowRight } from "lucide-react";

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
    <main className="mx-auto mt-6 mb-12 max-w-6xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <Receipt className="h-4 w-4 text-primary" />
          <span>Verifikasi Finansial</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Verifikasi Mutasi & Transaksi Masuk
        </h1>
        <p className="text-sm text-muted">
          Pemeriksaan bukti transfer donasi ke rekening resmi BSI 7367215121 a.n. Orang Tua Asuh UIKA Bogor.
        </p>
      </div>

      {/* Filter Status */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <form className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Status Transaksi:</span>
          </span>
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {DAFTAR_STATUS.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS_TRANSAKSI[s] ?? s}
              </option>
            ))}
          </select>
          <Tombol type="submit" variant="primer" ukuran="sm">
            Terapkan Filter
          </Tombol>
        </form>
      </div>

      {/* Tabel Transaksi */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Daftar Transaksi Donasi</h2>
            <p className="text-xs text-muted">Ditemukan {daftar.length} transaksi dengan status terpilih</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-3 pl-2">Donatur / Munfiq</th>
                <th className="pb-3">Nominal Masuk</th>
                <th className="pb-3">Metode</th>
                <th className="pb-3">Tanggal Bayar</th>
                <th className="pb-3">Peruntukan</th>
                <th className="pb-3 pr-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {daftar.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-surface-alt/40">
                  <td className="py-3.5 pl-2 font-bold text-ink">
                    {t.ortuAsuh.atasNamaMunfiq || t.ortuAsuh.nama}
                  </td>
                  <td className="py-3.5 font-mono font-bold text-primary">
                    {formatRupiah(t.nominal)}
                  </td>
                  <td className="py-3.5 text-xs text-muted">
                    <span className="rounded-md bg-surface-alt px-2 py-0.5 font-medium text-ink">
                      {t.metode}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs text-muted font-mono">
                    {t.tglBayar.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3.5 text-xs text-muted">
                    {t.jadwalBayar
                      ? `${t.jadwalBayar.periode.kode} (Angsuran #${t.jadwalBayar.urutan})`
                      : "Donasi Bebas / Non-Jadwal"}
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <Link href={`/admin/transaksi/${t.id}`}>
                      <Tombol variant="garis" ukuran="sm" className="font-semibold">
                        <span>Review Bukti</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Tombol>
                    </Link>
                  </td>
                </tr>
              ))}
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-muted">
                    Tidak ada transaksi pada status ini.
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
