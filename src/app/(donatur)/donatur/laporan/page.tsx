import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/uang";
import { ambilLaporanPenyaluranOrtuAsuh } from "@/server/queries/laporan";

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

  const total = laporan.reduce((acc, b) => acc + b.totalDisalurkan, 0n);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Laporan Penyaluran</h1>
      <p className="mt-1 text-sm text-gray-600">
        Dana Anda dipooling dan dibagi mesin alokasi ke beberapa mahasiswa — bukan
        earmark satu-ke-satu. Ini rincian ke mana saja rupiah Anda tersebar.
      </p>

      <form className="mt-4 flex gap-3 text-sm">
        <select name="periodeId" defaultValue={params.periodeId ?? ""} className="rounded border px-2 py-1">
          <option value="">Semua periode</option>
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border px-3 py-1">
          Filter
        </button>
      </form>

      <p className="mt-4 text-sm">
        Total tersalurkan: <span className="font-semibold">{formatRupiah(total)}</span>
      </p>

      <table className="mt-2 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Mahasiswa</th>
            <th>Program studi</th>
            <th>Total diterima</th>
            <th>Jumlah alokasi</th>
          </tr>
        </thead>
        <tbody>
          {laporan.map((b) => (
            <tr key={b.mahasiswaId} className="border-b">
              <td className="py-2">{b.namaTampilan}</td>
              <td>{b.prodi}</td>
              <td>{formatRupiah(b.totalDisalurkan)}</td>
              <td>{b.jumlahAlokasi}</td>
            </tr>
          ))}
          {laporan.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-gray-500">
                Belum ada penyaluran.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
