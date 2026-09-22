import Link from "next/link";
import { formatRupiah } from "@/lib/uang";
import { ambilDaftarKomitmenAdmin } from "@/server/queries/komitmen";
import { labelSkema } from "@/lib/pendaftaran-donatur/label";
import { Lencana } from "@/components/ui/lencana";
import { CheckCircle2 } from "lucide-react";
import { TombolKonfirmasi, TombolBatalkan } from "./tombol-konfirmasi";

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
    <div>
      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {DAFTAR_STATUS.map((s) => {
          const aktif = status === s;
          return (
            <Link
              key={s}
              href={`/admin/keuangan/komitmen?status=${s}`}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                aktif
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface text-muted border border-border hover:bg-surface-alt hover:text-ink"
              }`}
            >
              <span>{LABEL_STATUS_KOMITMEN[s]}</span>
            </Link>
          );
        })}
      </div>

      {/* Tabel Komitmen */}
      <div className="mt-4 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-surface">
          <div>
            <h2 className="font-heading text-sm font-bold text-ink">Daftar Komitmen Donatur</h2>
            <p className="text-[11px] text-muted">Menampilkan {daftar.length} data ({LABEL_STATUS_KOMITMEN[status]})</p>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xs">
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3 pl-5 pr-4">Donatur / Munfiq</th>
                <th className="py-3 px-4">Skema Bantuan</th>
                <th className="py-3 px-4">Nominal / Periode</th>
                <th className="py-3 px-4 text-center">Durasi</th>
                <th className="py-3 px-4">Mekanisme</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 pl-4 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {daftar.map((k) => (
                <tr key={k.id} className="transition-colors hover:bg-surface-alt/50">
                  <td className="py-3 pl-5 pr-4 font-bold text-ink">
                    {k.ortuAsuh.atasNamaMunfiq || k.ortuAsuh.nama}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    <span className="rounded-md bg-surface-alt px-2 py-0.5 font-medium text-ink">
                      {labelSkema(k.skema)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {formatRupiah(k.nominalPerPeriode)}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-ink">
                    {k.jumlahPeriode} Periode
                  </td>
                  <td className="py-3 px-4 text-muted">
                    <span className="rounded-md bg-surface-alt px-2 py-0.5 font-medium text-ink">
                      {k.mekanisme.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Lencana nada={NADA_STATUS_KOMITMEN[k.status] ?? "netral"}>
                      {LABEL_STATUS_KOMITMEN[k.status] ?? k.status}
                    </Lencana>
                  </td>
                  <td className="py-3 pl-4 pr-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {k.status === "MENUNGGU_KONFIRMASI" && <TombolKonfirmasi komitmenId={k.id} />}
                      {(k.status === "MENUNGGU_KONFIRMASI" || k.status === "AKTIF" || k.status === "MENUNGGAK") && (
                        <TombolBatalkan komitmenId={k.id} />
                      )}
                      {k.status === "SELESAI" || k.status === "DIBATALKAN" ? (
                        <span className="text-xs text-muted">-</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {daftar.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-muted/40 mb-2" />
                    <p className="font-semibold text-ink">Tidak ada data komitmen pada status ini</p>
                    <p className="text-[11px] text-muted">Seluruh pengajuan komitmen telah diproses.</p>
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
