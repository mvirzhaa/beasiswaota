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
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">Review Batch Alokasi</h1>
      <p className="mt-1 text-sm text-gray-600">
        Batch {batchId} · Periode {daftar[0].periode.kode} · Status {status} · Total{" "}
        {formatRupiah(totalBatch)}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {daftar.map((a) => (
          <div key={a.id} className="rounded border p-3 text-sm">
            <p className="font-medium">
              {a.tagihan.mahasiswa.nama} ({a.tagihan.mahasiswa.nim}) — {a.tagihan.mahasiswa.prodi}
            </p>
            <p className="text-gray-600">Nominal: {formatRupiah(a.nominal)}</p>
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500">Sumber dana:</p>
              <ul className="list-inside list-disc text-xs text-gray-600">
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
