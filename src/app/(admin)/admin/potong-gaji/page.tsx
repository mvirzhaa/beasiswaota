import { Download, UploadCloud } from "lucide-react";
import { formatRupiah } from "@/lib/uang";
import { ambilDaftarPotonganBulanBerjalan } from "@/server/queries/potong-gaji";
import { Tombol } from "@/components/ui/tombol";
import { PanelRealisasi } from "./panel-realisasi";

export default async function HalamanPotongGajiAdmin() {
  const daftar = await ambilDaftarPotonganBulanBerjalan();
  const total = daftar.reduce((acc, j) => acc + j.nominal, 0n);
  const opsiJadwal = daftar.map((j) => ({
    id: j.id,
    label: `${j.komitmen.ortuAsuh.atasNamaMunfiq || j.komitmen.ortuAsuh.nama} · ${j.periode.kode} · ${formatRupiah(j.nominal)}`,
  }));

  return (
    <div>
      {/* 2-Column Side-by-Side Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (7 cols): Daftar Potongan */}
        <div className="lg:col-span-7 xl:col-span-8">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="font-heading text-base font-bold text-ink">
                  Potongan Bulan Berjalan ({daftar.length})
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Total Terkumpul: <strong className="text-primary font-mono">{formatRupiah(total)}</strong>
                </p>
              </div>
              <a href="/api/admin/potong-gaji/ekspor">
                <Tombol variant="garis" ukuran="sm" className="font-semibold text-xs">
                  <Download className="h-3.5 w-3.5" />
                  <span>Ekspor XLSX Payroll</span>
                </Tombol>
              </a>
            </div>

            <div className="mt-4 max-h-[550px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface-alt/90 backdrop-blur-xs">
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-muted">
                    <th className="py-3 pr-3 pl-2">NIP</th>
                    <th className="py-3 px-3">Donatur</th>
                    <th className="py-3 px-3">Periode</th>
                    <th className="py-3 px-3">Nominal</th>
                    <th className="py-3 pr-2 text-right">Jatuh Tempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {daftar.map((j) => (
                    <tr key={j.id} className="transition-colors hover:bg-surface-alt/40">
                      <td className="py-2.5 pr-3 pl-2 font-mono text-muted">{j.komitmen.ortuAsuh.nip ?? "-"}</td>
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        {j.komitmen.ortuAsuh.atasNamaMunfiq || j.komitmen.ortuAsuh.nama}
                      </td>
                      <td className="py-2.5 px-3 text-muted">{j.periode.kode}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{formatRupiah(j.nominal)}</td>
                      <td className="py-2.5 pr-2 text-right font-mono text-muted">
                        {j.jatuhTempo.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {daftar.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-muted">
                        Tidak ada potongan gaji pada bulan berjalan ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Impor Realisasi */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <UploadCloud className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-ink">Catat Realisasi Payroll</h2>
            </div>
            <div className="rounded-xl bg-surface-alt/60 p-3 text-[11px] text-muted mb-4 space-y-1">
              <div className="font-semibold text-ink">Alur Impor Excel:</div>
              <div>1. Unduh "Ekspor XLSX Payroll" di atas (sudah terisi NIP, nama, periode, nominal).</div>
              <div>2. Isi kolom Nominal Realisasi &amp; Tanggal Realisasi dari bendahara payroll.</div>
              <div>3. Unggah kembali file yang sama lewat "Impor Excel" di bawah.</div>
            </div>
            <PanelRealisasi opsiJadwal={opsiJadwal} />
          </section>
        </div>
      </div>
    </div>
  );
}
