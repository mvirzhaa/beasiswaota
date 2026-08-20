import Link from "next/link";
import { ambilDaftarLaporanAdmin } from "@/server/queries/laporan-perkembangan";

type StatusFilter = "DRAFT" | "DIKIRIM" | "PERLU_REVISI" | "DIVERIFIKASI";
const DAFTAR_STATUS: StatusFilter[] = ["DRAFT", "DIKIRIM", "PERLU_REVISI", "DIVERIFIKASI"];

export default async function HalamanLaporanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = DAFTAR_STATUS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "DIKIRIM";

  const daftar = await ambilDaftarLaporanAdmin({ status });

  return (
    <main className="mx-auto max-w-4xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Review Laporan Perkembangan</h1>

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
            <th className="py-2">Mahasiswa</th>
            <th>Periode</th>
            <th>Batas kirim</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {daftar.map((l) => (
            <tr key={l.id} className="border-b">
              <td className="py-2">
                {l.mahasiswa.nama} ({l.mahasiswa.nim})
              </td>
              <td>{l.periode.kode}</td>
              <td>{l.batasKirim.toLocaleDateString("id-ID")}</td>
              <td>
                <Link href={`/admin/laporan/${l.id}`} className="underline">
                  Review
                </Link>
              </td>
            </tr>
          ))}
          {daftar.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-muted">
                Tidak ada laporan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
