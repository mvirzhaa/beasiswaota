"use client";

export function SelectorPeriode({
  periodeList,
  periodeAktifId,
}: {
  periodeList: { id: string; kode: string }[];
  periodeAktifId?: string;
}) {
  return (
    <form method="GET" className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-ink">Periode untuk Laporan Perkembangan:</span>
        <select
          name="periode"
          defaultValue={periodeAktifId}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
