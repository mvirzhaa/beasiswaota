import { formatRupiah } from "@/lib/uang";
import { ambilDaftarKomitmenAdmin } from "@/server/queries/komitmen";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import { HandCoins, Filter } from "lucide-react";
import { TombolKonfirmasi } from "./tombol-konfirmasi";

type StatusFilter =
  | "MENUNGGU_KONFIRMASI"
  | "AKTIF"
  | "MENUNGGAK"
  | "SELESAI"
  | "DIBATALKAN";

const DAFTAR_STATUS: StatusFilter[] = [
  "MENUNGGU_KONFIRMASI",
  "AKTIF",
  "MENUNGGAK",
  "SELESAI",
  "DIBATALKAN",
];

const LABEL_STATUS_KOMITMEN: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi",
  AKTIF: "Aktif Berjalan",
  MENUNGGAK: "Menunggak",
  SELESAI: "Selesai Penuh",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS_KOMITMEN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_KONFIRMASI: "peringatan",
  AKTIF: "sukses",
  MENUNGGAK: "bahaya",
  SELESAI: "info",
  DIBATALKAN: "netral",
};

export default async function HalamanKomitmenAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = DAFTAR_STATUS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "MENUNGGU_KONFIRMASI";

  const daftar = await ambilDaftarKomitmenAdmin({ status });

  return (
    <main className="mx-auto mt-6 mb-12 max-w-6xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <HandCoins className="h-4 w-4 text-primary" />
          <span>Komitmen Donatur</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Konfirmasi & Kelola Komitmen Donasi
        </h1>
        <p className="text-sm text-muted">
          Persetujuan komitmen donasi rutin orang tua asuh serta pemantauan jadwal angsuran.
        </p>
      </div>

      {/* Filter Status */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <form className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Status Komitmen:</span>
          </span>
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {DAFTAR_STATUS.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS_KOMITMEN[s] ?? s}
              </option>
            ))}
          </select>
          <Tombol type="submit" variant="primer" ukuran="sm">
            Terapkan Filter
          </Tombol>
        </form>
      </div>

      {/* Tabel Komitmen */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Daftar Komitmen Donatur</h2>
            <p className="text-xs text-muted">Total {daftar.length} komitmen donasi</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                <th className="pb-3 pl-2">Donatur / Munfiq</th>
                <th className="pb-3">Skema Bantuan</th>
                <th className="pb-3">Nominal / Periode</th>
                <th className="pb-3 text-center">Durasi</th>
                <th className="pb-3">Mekanisme</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {daftar.map((k) => (
                <tr key={k.id} className="transition-colors hover:bg-surface-alt/40">
                  <td className="py-3.5 pl-2 font-bold text-ink">
                    {k.ortuAsuh.atasNamaMunfiq || k.ortuAsuh.nama}
                  </td>
                  <td className="py-3.5 text-xs text-ink font-medium">
                    {k.skema === "FULL" ? "Beasiswa Penuh (Full)" : "Beasiswa Parsial"}
                  </td>
                  <td className="py-3.5 font-mono font-bold text-primary">
                    {formatRupiah(k.nominalPerPeriode)}
                  </td>
                  <td className="py-3.5 text-center font-semibold text-ink text-xs">
                    {k.jumlahPeriode} Periode
                  </td>
                  <td className="py-3.5 text-xs text-muted">
                    <span className="rounded-md bg-surface-alt px-2 py-0.5 font-medium text-ink">
                      {k.mekanisme}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <Lencana nada={NADA_STATUS_KOMITMEN[k.status] ?? "netral"}>
                      {LABEL_STATUS_KOMITMEN[k.status] ?? k.status}
                    </Lencana>
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    {k.status === "MENUNGGU_KONFIRMASI" ? (
                      <TombolKonfirmasi komitmenId={k.id} />
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted">
                    Tidak ada data komitmen pada status ini.
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
