import Link from "next/link";
import { formatRupiah } from "@/lib/uang";
import { ambilDaftarTransaksiAdmin } from "@/server/queries/transaksi";

type StatusFilter = "MENUNGGU_VERIFIKASI" | "TERVERIFIKASI" | "DITOLAK" | "DIKEMBALIKAN";

const DAFTAR_STATUS: StatusFilter[] = [
  "MENUNGGU_VERIFIKASI",
  "TERVERIFIKASI",
  "DITOLAK",
  "DIKEMBALIKAN",
];

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
    <main className="mx-auto max-w-5xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Verifikasi Transaksi</h1>

      <form className="mt-4 flex gap-3 text-sm">
        <select name="status" defaultValue={status} className="rounded-lg border border-border px-2 py-1">
          {DAFTAR_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-border px-3 py-1">
          Filter
        </button>
      </form>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Donatur</th>
            <th>Nominal</th>
            <th>Metode</th>
            <th>Tgl bayar</th>
            <th>Untuk jadwal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {daftar.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">{t.ortuAsuh.atasNamaMunfiq || t.ortuAsuh.nama}</td>
              <td>{formatRupiah(t.nominal)}</td>
              <td>{t.metode}</td>
              <td>{t.tglBayar.toLocaleDateString("id-ID")}</td>
              <td>
                {t.jadwalBayar
                  ? `${t.jadwalBayar.periode.kode} #${t.jadwalBayar.urutan}`
                  : "Donasi bebas"}
              </td>
              <td>
                <Link href={`/admin/transaksi/${t.id}`} className="underline">
                  Review
                </Link>
              </td>
            </tr>
          ))}
          {daftar.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-muted">
                Tidak ada transaksi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
