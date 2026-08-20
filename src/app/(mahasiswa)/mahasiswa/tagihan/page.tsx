import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import { ambilTagihanMahasiswa, ambilRiwayatBantuanMahasiswa } from "@/server/queries/tagihan";
import { Lencana } from "@/components/ui/lencana";
import { Receipt, History, CheckCircle2, Clock } from "lucide-react";

const LABEL_STATUS: Record<string, string> = {
  BELUM_LUNAS: "Belum Lunas",
  LUNAS_SEBAGIAN: "Lunas Sebagian",
  LUNAS: "Lunas",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  BELUM_LUNAS: "bahaya",
  LUNAS_SEBAGIAN: "peringatan",
  LUNAS: "sukses",
  DIBATALKAN: "netral",
};

export default async function HalamanTagihanMahasiswa() {
  const session = await auth();
  const userId = session!.user.id;

  const [tagihan, riwayat] = await Promise.all([
    ambilTagihanMahasiswa(userId),
    ambilRiwayatBantuanMahasiswa(userId),
  ]);

  const totalTagihan = tagihan.reduce((acc, t) => acc + t.nominal, 0n);
  const totalTerbayar = tagihan.reduce((acc, t) => acc + t.terbayar, 0n);
  const totalBantuan = riwayat.reduce((acc, r) => acc + r.nominal, 0n);
  const sisaKewajiban = totalTagihan > totalTerbayar ? totalTagihan - totalTerbayar : 0n;

  return (
    <main className="mx-auto mt-6 mb-12 max-w-5xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <Receipt className="h-4 w-4 text-primary" />
          <span>Keuangan & UKT</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Tagihan & Riwayat Bantuan
        </h1>
        <p className="text-sm text-muted">
          Pantau status tagihan Uang Kuliah Tunggal (UKT) dan alokasi beasiswa yang telah disalurkan.
        </p>
      </div>

      {/* Metrik Ringkasan Finansial */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Total Tagihan UKT</span>
            <Receipt className="h-4 w-4 text-muted/60" />
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-ink">
            {formatRupiah(totalTagihan)}
          </p>
          <span className="mt-1 block text-[11px] text-muted">
            {tagihan.length} Komponen Tagihan
          </span>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary-light/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-primary-dark">
            <span className="font-semibold">Bantuan Beasiswa Tersalur</span>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-primary">
            {formatRupiah(totalBantuan)}
          </p>
          <span className="mt-1 block text-[11px] text-primary-dark/80">
            {riwayat.length} Kali Penyaluran
          </span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-900">
            <span className="font-semibold">Sisa Kewajiban UKT</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-bold text-amber-950">
            {formatRupiah(sisaKewajiban)}
          </p>
          <span className="mt-1 block text-[11px] text-amber-800">
            {sisaKewajiban === 0n ? "Semua tagihan lunas" : "Perlu penyelesaian / beasiswa"}
          </span>
        </div>
      </div>

      {/* Bagian 1: Daftar Tagihan */}
      <section className="mt-8">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">Daftar Tagihan UKT</h2>
              <p className="text-xs text-muted">Rincian kewajiban per semester perkuliahan</p>
            </div>
            <span className="text-xs font-semibold text-muted">{tagihan.length} Tagihan</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pl-2">Periode</th>
                  <th className="pb-3">Komponen</th>
                  <th className="pb-3">Nominal UKT</th>
                  <th className="pb-3">Terbayar</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tagihan.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-surface-alt/40">
                    <td className="py-3.5 pl-2 font-semibold text-ink">{t.periode.kode}</td>
                    <td className="py-3.5 text-muted">{t.komponen}</td>
                    <td className="py-3.5 font-mono font-medium text-ink">{formatRupiah(t.nominal)}</td>
                    <td className="py-3.5 font-mono font-medium text-primary">{formatRupiah(t.terbayar)}</td>
                    <td className="py-3.5 pr-2 text-right">
                      <Lencana nada={NADA_STATUS[t.status] ?? "netral"}>
                        {LABEL_STATUS[t.status] ?? t.status}
                      </Lencana>
                    </td>
                  </tr>
                ))}
                {tagihan.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted">
                      Belum ada catatan tagihan aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bagian 2: Riwayat Bantuan Beasiswa Diterima */}
      <section className="mt-8">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                <History className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">Riwayat Bantuan Disalurkan</h2>
                <p className="text-xs text-muted">Daftar bantuan beasiswa yang telah memotong tagihan UKT Anda</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted">{riwayat.length} Penyaluran</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pl-2">Periode</th>
                  <th className="pb-3">Nominal Bantuan</th>
                  <th className="pb-3">Sumber / Donatur</th>
                  <th className="pb-3 pr-2 text-right">Tanggal Salur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {riwayat.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-surface-alt/40">
                    <td className="py-3.5 pl-2 font-semibold text-ink">{r.periodeKode}</td>
                    <td className="py-3.5 font-mono font-bold text-primary">{formatRupiah(r.nominal)}</td>
                    <td className="py-3.5 text-muted">{r.namaDonaturTampilan}</td>
                    <td className="py-3.5 pr-2 text-right text-xs text-muted font-mono">
                      {r.tglSalur ? r.tglSalur.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                  </tr>
                ))}
                {riwayat.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-muted">
                      Belum ada bantuan beasiswa yang tercatat disalurkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
