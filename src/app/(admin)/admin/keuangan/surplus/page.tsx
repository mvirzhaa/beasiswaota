import { formatRupiah } from "@/lib/uang";
import { ambilStatistikKeuangan } from "@/server/queries/statistik-keuangan";
import { ambilMutasiDanaTerbaru } from "@/server/queries/dana-ledger";
import { Lencana } from "@/components/ui/lencana";
import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";

export default async function HalamanSurplusKeuangan() {
  const [statistik, mutasi] = await Promise.all([
    ambilStatistikKeuangan(),
    ambilMutasiDanaTerbaru(30),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4.5 shadow-2xs">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600">
            <ArrowUpCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="mt-2.5 font-heading text-xl font-bold text-ink">
            {formatRupiah(statistik.totalPemasukan)}
          </div>
          <div className="text-xs text-muted">Total Pemasukan (terverifikasi)</div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4.5 shadow-2xs">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-50 text-amber-600">
            <ArrowDownCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="mt-2.5 font-heading text-xl font-bold text-ink">
            {formatRupiah(statistik.totalPengeluaran)}
          </div>
          <div className="text-xs text-muted">Total Pengeluaran (tersalur ke mahasiswa)</div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary-light/40 p-4.5 shadow-2xs">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-light text-primary-dark">
            <Scale className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="mt-2.5 font-heading text-xl font-bold text-primary-dark">
            {formatRupiah(statistik.surplus)}
          </div>
          <div className="text-xs text-primary-dark/70">Surplus (Pemasukan − Pengeluaran)</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-heading text-base font-bold text-ink">Riwayat Mutasi Dana</h2>
            <p className="text-xs text-muted">Dana masuk dan dana keluar terbaru, untuk apa dan berapa nominalnya.</p>
          </div>
        </div>

        <div className="mt-3 divide-y divide-border/60">
          {mutasi.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <Lencana nada={m.tipe === "KREDIT" ? "sukses" : "info"}>
                  {m.tipe === "KREDIT" ? "Masuk" : "Keluar"}
                </Lencana>
                <div>
                  <p className="font-semibold text-ink">
                    {m.tipe === "KREDIT" ? "Dari" : "Ke"} {m.pihak}
                  </p>
                  <p className="text-xs text-muted">
                    {m.keterangan} · Periode {m.periodeKode} ·{" "}
                    {m.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <span className={`font-mono font-bold ${m.tipe === "KREDIT" ? "text-emerald-700" : "text-amber-700"}`}>
                {m.tipe === "KREDIT" ? "+" : "−"}
                {formatRupiah(m.nominal)}
              </span>
            </div>
          ))}
          {mutasi.length === 0 && (
            <p className="py-8 text-center text-xs text-muted">Belum ada mutasi dana tercatat.</p>
          )}
        </div>
      </div>
    </div>
  );
}
