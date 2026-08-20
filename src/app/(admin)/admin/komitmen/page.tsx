import { formatRupiah } from "@/lib/uang";
import { ambilDaftarKomitmenAdmin } from "@/server/queries/komitmen";
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
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">Konfirmasi Komitmen</h1>

      <form className="mt-4 flex gap-3 text-sm">
        <select name="status" defaultValue={status} className="rounded border px-2 py-1">
          {DAFTAR_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border px-3 py-1">
          Filter
        </button>
      </form>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Donatur</th>
            <th>Skema</th>
            <th>Nominal/periode</th>
            <th>Jangka waktu</th>
            <th>Mekanisme</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {daftar.map((k) => (
            <tr key={k.id} className="border-b">
              <td className="py-2">{k.ortuAsuh.atasNamaMunfiq || k.ortuAsuh.nama}</td>
              <td>{k.skema}</td>
              <td>{formatRupiah(k.nominalPerPeriode)}</td>
              <td>{k.jumlahPeriode}x</td>
              <td>{k.mekanisme}</td>
              <td>
                {k.status === "MENUNGGU_KONFIRMASI" && <TombolKonfirmasi komitmenId={k.id} />}
              </td>
            </tr>
          ))}
          {daftar.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                Tidak ada komitmen.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
