import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/uang";
import { ambilLaporanPenyaluranOrtuAsuh } from "@/server/queries/laporan";
import { Tombol } from "@/components/ui/tombol";
import {
  ClipboardList,
  Filter,
  DollarSign,
  Users,
  Layers,
  Info,
  } from "lucide-react";

export default async function HalamanLaporanDonatur({
  searchParams,
}: {
  searchParams: Promise<{ periodeId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const params = await searchParams;

  const [periodeList, laporan] = await Promise.all([
    prisma.periode.findMany({ orderBy: { tglBuka: "desc" }, select: { id: true, kode: true } }),
    ambilLaporanPenyaluranOrtuAsuh(userId, params.periodeId || undefined),
  ]);

  const totalDisalurkan = laporan.reduce((acc, b) => acc + b.totalDisalurkan, 0n);
  const totalAlokasi = laporan.reduce((acc, b) => acc + b.jumlahAlokasi, 0);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-5xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span>Transparansi & Akuntabilitas</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Laporan Penyaluran Dana
        </h1>
        <p className="text-sm text-muted">
          Rincian penyaluran rupiah donasi Anda yang dialokasikan ke mahasiswa penerima beasiswa UIKA.
        </p>
      </div>

      {/* Ringkasan Metrik */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              Total Dana Tersalurkan
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-primary">
            {formatRupiah(totalDisalurkan)}
          </p>
          <p className="mt-1 text-xs text-muted">Dari seluruh transaksi terverifikasi</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              Mahasiswa Penerima
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent-dark">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-ink">
            {laporan.length} Mahasiswa
          </p>
          <p className="mt-1 text-xs text-muted">Menerima dukungan dari dana Anda</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">
              Frekuensi Alokasi
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-ink">
            {totalAlokasi} Kali
          </p>
          <p className="mt-1 text-xs text-muted">Batch penyaluran mesin alokasi</p>
        </div>
      </div>

      {/* Filter & Tabel Data */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-base font-bold text-ink">Filter Periode Semester</h2>
          </div>

          <form className="flex flex-wrap items-center gap-2 text-sm">
            <select
              name="periodeId"
              defaultValue={params.periodeId ?? ""}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Semua Periode</option>
              {periodeList.map((p) => (
                <option key={p.id} value={p.id}>
                  Semester {p.kode}
                </option>
              ))}
            </select>
            <Tombol type="submit" variant="primer" ukuran="sm">
              Terapkan
            </Tombol>
          </form>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-3 pl-2">Mahasiswa Penerima</th>
                <th className="pb-3">Program Studi</th>
                <th className="pb-3">Total Dana Diterima</th>
                <th className="pb-3 pr-2 text-right">Frekuensi Penyaluran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {laporan.map((b) => (
                <tr
                  key={b.mahasiswaId}
                  className="transition-colors hover:bg-surface-alt/40"
                >
                  <td className="py-3.5 pl-2 font-medium text-ink">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-light text-xs font-bold text-primary">
                        {b.namaTampilan.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{b.namaTampilan}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-xs text-muted font-medium">
                    {b.prodi}
                  </td>
                  <td className="py-3.5 font-heading font-bold text-primary">
                    {formatRupiah(b.totalDisalurkan)}
                  </td>
                  <td className="py-3.5 pr-2 text-right text-xs font-semibold text-ink">
                    {b.jumlahAlokasi} Alokasi
                  </td>
                </tr>
              ))}
              {laporan.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    <ClipboardList className="mx-auto h-8 w-8 text-muted/40" />
                    <p className="mt-2 font-medium text-ink">Belum Ada Penyaluran</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Data penyaluran akan muncul setelah mesin alokasi periode ini dijalankan dan disetujui.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Penjelasan Sistem Pooling */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/80 bg-surface-alt/40 p-4 text-xs text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="leading-relaxed">
          <strong>Transparansi Penyaluran:</strong> Dana Anda dikumpulkan bersama dana munfiq lainnya, lalu dibagikan ke mahasiswa yang memenuhi kriteria prioritas skoring. Nama mahasiswa disamarkan menjadi inisial demi menjaga martabat dan privasi mahasiswa penerima beasiswa.
        </p>
      </div>
    </main>
  );
}
