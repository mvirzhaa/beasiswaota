import Link from "next/link";
import { prisma } from "@/lib/db";
import { ambilDaftarPengajuanAdmin } from "@/server/queries/pengajuan";
import { TombolHitungUlangSkor } from "./hitung-ulang-skor";

type StatusFilter =
  | "DRAFT"
  | "DIAJUKAN"
  | "VERIFIKASI_BERKAS"
  | "DISETUJUI"
  | "DITOLAK"
  | "DIBATALKAN";

const DAFTAR_STATUS: StatusFilter[] = [
  "DRAFT",
  "DIAJUKAN",
  "VERIFIKASI_BERKAS",
  "DISETUJUI",
  "DITOLAK",
  "DIBATALKAN",
];

export default async function HalamanDaftarPengajuanAdmin({
  searchParams,
}: {
  searchParams: Promise<{ periodeId?: string; status?: string }>;
}) {
  const params = await searchParams;
  const periodeList = await prisma.periode.findMany({
    orderBy: { tglBuka: "desc" },
    select: { id: true, kode: true },
  });

  const status = DAFTAR_STATUS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : undefined;

  const daftar = await ambilDaftarPengajuanAdmin({
    periodeId: params.periodeId || undefined,
    status,
  });

  return (
    <main className="mx-auto max-w-5xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Daftar Pengajuan</h1>

      <form className="mt-4 flex flex-wrap gap-3 text-sm">
        <select name="periodeId" defaultValue={params.periodeId ?? ""} className="rounded-lg border border-border px-2 py-1">
          <option value="">Semua periode</option>
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className="rounded-lg border border-border px-2 py-1">
          <option value="">Semua status</option>
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

      <div className="mt-3">
        <TombolHitungUlangSkor periodeId={params.periodeId || undefined} />
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Mahasiswa</th>
            <th>Periode</th>
            <th>Status</th>
            <th>Skor</th>
            <th>Berkas</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {daftar.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">
                {p.mahasiswa.nama} ({p.mahasiswa.nim})
              </td>
              <td>{p.periode.kode}</td>
              <td>{p.status}</td>
              <td>{p.skor?.toString() ?? "-"}</td>
              <td>
                {p.berkas.filter((b) => b.status === "VALID").length}/
                {p.berkas.length} valid
              </td>
              <td>
                <Link href={`/admin/pengajuan/${p.id}`} className="underline">
                  Review
                </Link>
              </td>
            </tr>
          ))}
          {daftar.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-muted">
                Tidak ada pengajuan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
