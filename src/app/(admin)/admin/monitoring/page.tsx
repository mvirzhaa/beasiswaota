import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  ambilDaftarPenerimaAktifAdmin,
  ambilBelumLaporAdmin,
} from "@/server/queries/monitoring";

const LABEL_RISIKO: Record<string, string> = {
  AMAN: "Aman",
  PERHATIAN: "Perhatian",
  KRITIS: "Kritis",
};

export default async function HalamanMonitoringAdmin({
  searchParams,
}: {
  searchParams: Promise<{ periodeId?: string; fakultas?: string }>;
}) {
  const params = await searchParams;

  const periodeList = await prisma.periode.findMany({
    orderBy: { tglBuka: "desc" },
    select: { id: true, kode: true },
  });
  const periodeId = params.periodeId || periodeList[0]?.id;

  if (!periodeId) {
    return (
      <main className="mx-auto max-w-5xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
        <h1 className="font-heading text-2xl font-bold text-ink">Monitoring Akademik</h1>
        <p className="mt-4 text-sm text-muted">Belum ada periode.</p>
      </main>
    );
  }

  const [penerima, belumLapor] = await Promise.all([
    ambilDaftarPenerimaAktifAdmin(periodeId, params.fakultas || undefined),
    ambilBelumLaporAdmin(periodeId),
  ]);

  const peringatanDini = penerima.filter((p) => p.risiko === "PERHATIAN" || p.risiko === "KRITIS");
  const daftarFakultas = [...new Set(penerima.map((p) => p.fakultas))];

  return (
    <main className="mx-auto max-w-5xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">Monitoring Akademik</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/monitoring/input" className="rounded-lg border border-border px-3 py-1">
            Input manual
          </Link>
          <Link href="/admin/monitoring/impor" className="rounded-lg border border-border px-3 py-1">
            Impor XLSX
          </Link>
        </div>
      </div>

      <form className="mt-4 flex flex-wrap gap-3 text-sm">
        <select name="periodeId" defaultValue={periodeId} className="rounded-lg border border-border px-2 py-1">
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
        <select name="fakultas" defaultValue={params.fakultas ?? ""} className="rounded-lg border border-border px-2 py-1">
          <option value="">Semua fakultas</option>
          {daftarFakultas.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-border px-3 py-1">
          Filter
        </button>
      </form>

      <section className="mt-6 rounded border border-amber-300 bg-amber-50 p-4">
        <h2 className="font-semibold text-amber-900">
          Peringatan dini ({peringatanDini.length})
        </h2>
        <ul className="mt-2 text-sm text-amber-900">
          {peringatanDini.map((p) => (
            <li key={p.mahasiswaId}>
              {p.nama} ({p.nim}) — {LABEL_RISIKO[p.risiko ?? ""] ?? p.risiko} · IPK {p.ipk ?? "-"}
            </li>
          ))}
          {peringatanDini.length === 0 && <li>Tidak ada.</li>}
        </ul>
      </section>

      <section className="mt-6 rounded border border-red-300 bg-red-50 p-4">
        <h2 className="font-semibold text-red-900">
          Belum kirim laporan menjelang batas ({belumLapor.length})
        </h2>
        <ul className="mt-2 text-sm text-red-900">
          {belumLapor.map((b) => (
            <li key={b.mahasiswaId}>
              {b.nama} ({b.nim}) — batas {b.batasKirim.toLocaleDateString("id-ID")} · status{" "}
              {b.statusLaporan ?? "belum dibuat"}
            </li>
          ))}
          {belumLapor.length === 0 && <li>Tidak ada.</li>}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-bold text-ink">Semua penerima aktif ({penerima.length})</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Nama</th>
              <th>Fakultas/Prodi</th>
              <th>IPK</th>
              <th>Status akademik</th>
              <th>Risiko</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {penerima.map((p) => (
              <tr key={p.mahasiswaId} className="border-b">
                <td className="py-2">
                  {p.nama} ({p.nim})
                </td>
                <td>
                  {p.fakultas} / {p.prodi}
                </td>
                <td>{p.ipk ?? "-"}</td>
                <td>{p.statusAkademik ?? "-"}</td>
                <td>{p.risiko ? LABEL_RISIKO[p.risiko] : "Belum ada data"}</td>
                <td>
                  <Link
                    href={`/admin/monitoring/input?mahasiswaId=${p.mahasiswaId}&periodeId=${periodeId}`}
                    className="underline"
                  >
                    Input
                  </Link>
                </td>
              </tr>
            ))}
            {penerima.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-muted">
                  Tidak ada penerima aktif.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
