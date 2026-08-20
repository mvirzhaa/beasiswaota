import { auth } from "@/lib/auth";
import {
  ambilPeriodePenerimaMahasiswa,
  ambilLaporanMahasiswa,
} from "@/server/queries/laporan-perkembangan";
import { FormLaporan } from "./form-laporan";

export default async function HalamanLaporanMahasiswa({
  searchParams,
}: {
  searchParams: Promise<{ periodeId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const params = await searchParams;

  const periodeList = await ambilPeriodePenerimaMahasiswa(userId);
  const periodeId = params.periodeId || periodeList[0]?.id;

  if (!periodeId) {
    return (
      <main className="mx-auto max-w-2xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
        <h1 className="font-heading text-2xl font-bold text-ink">Laporan Perkembangan</h1>
        <p className="mt-4 text-sm text-muted">
          Anda belum tercatat sebagai penerima beasiswa di periode mana pun.
        </p>
      </main>
    );
  }

  const laporan = await ambilLaporanMahasiswa(userId, periodeId);

  return (
    <main className="mx-auto max-w-2xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Laporan Perkembangan</h1>

      <form className="mt-4 flex gap-3 text-sm">
        <select name="periodeId" defaultValue={periodeId} className="rounded-lg border border-border px-2 py-1">
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-border px-3 py-1">
          Pilih periode
        </button>
      </form>

      <div className="mt-6">
        <FormLaporan periodeId={periodeId} laporan={laporan} />
      </div>
    </main>
  );
}
