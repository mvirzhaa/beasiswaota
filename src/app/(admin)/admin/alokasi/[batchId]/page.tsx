import { notFound } from "next/navigation";
import { formatRupiah } from "@/lib/uang";
import { ambilBatchDetail } from "@/server/queries/alokasi";
import { TombolSetujuiBatch } from "./tombol-setujui-batch";

export default async function HalamanReviewBatchAlokasi({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const daftar = await ambilBatchDetail(batchId);

  if (daftar.length === 0) {
    notFound();
  }

  const status = daftar[0].status;
  const totalBatch = daftar.reduce((acc, a) => acc + a.nominal, 0n);

  return (
    <main className="mx-auto max-w-4xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Review Batch Alokasi</h1>
      <p className="mt-1 text-sm text-muted">
        Batch {batchId} · Periode {daftar[0].periode.kode} · Status {status} · Total{" "}
        {formatRupiah(totalBatch)}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {daftar.map((a) => (
          <div key={a.id} className="rounded border p-3 text-sm">
            <p className="font-medium">
              {a.tagihan.mahasiswa.nama} ({a.tagihan.mahasiswa.nim}) — {a.tagihan.mahasiswa.prodi}
            </p>
            <p className="text-muted">Nominal: {formatRupiah(a.nominal)}</p>
            <div className="mt-2">
              <p className="text-xs font-medium text-muted">Sumber dana:</p>
              <ul className="list-inside list-disc text-xs text-muted">
                {a.sumber.map((s) => (
                  <li key={s.id}>
                    {formatRupiah(s.nominal)} dari{" "}
                    {s.transaksi.ortuAsuh.atasNamaMunfiq || s.transaksi.ortuAsuh.nama}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {status === "DRAFT" && (
        <div className="mt-6 border-t pt-4">
          <TombolSetujuiBatch batchId={batchId} />
        </div>
      )}
    </main>
  );
}
