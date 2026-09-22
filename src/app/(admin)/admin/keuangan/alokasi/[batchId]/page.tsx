import { notFound } from "next/navigation";
import { Shuffle } from "lucide-react";
import { formatRupiah } from "@/lib/uang";
import { ambilBatchDetail } from "@/server/queries/alokasi";
import { Lencana } from "@/components/ui/lencana";
import { TombolSetujuiBatch } from "./tombol-setujui-batch";

const LABEL_STATUS: Record<string, string> = {
  DRAFT: "Draft (Belum Disetujui)",
  DISETUJUI: "Disetujui",
  DISALURKAN: "Disalurkan",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  DRAFT: "peringatan",
  DISETUJUI: "sukses",
  DISALURKAN: "info",
  DIBATALKAN: "netral",
};

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
    <div>
      <div className="mb-6 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-accent-dark">
        <Shuffle className="h-3.5 w-3.5" />
        <span>Review Batch Alokasi</span>
      </div>
      <h1 className="font-heading text-2xl font-bold text-ink">Periode {daftar[0].periode.kode}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <span className="font-mono">{batchId}</span>
        <span>·</span>
        <Lencana nada={NADA_STATUS[status] ?? "netral"}>{LABEL_STATUS[status] ?? status}</Lencana>
        <span>·</span>
        <span className="font-semibold text-ink">Total {formatRupiah(totalBatch)}</span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {daftar.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">
                  {a.tagihan.mahasiswa.nama} <span className="font-normal text-muted">({a.tagihan.mahasiswa.nim})</span>
                </p>
                <p className="text-xs text-muted">{a.tagihan.mahasiswa.prodi}</p>
              </div>
              <span className="font-heading text-base font-bold text-primary">{formatRupiah(a.nominal)}</span>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">Sumber Dana</p>
              <ul className="flex flex-col gap-1">
                {a.sumber.map((s) => (
                  <li key={s.id} className="text-xs text-ink">
                    <span className="font-semibold">{formatRupiah(s.nominal)}</span>{" "}
                    <span className="text-muted">
                      dari {s.transaksi.ortuAsuh.atasNamaMunfiq || s.transaksi.ortuAsuh.nama}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {status === "DRAFT" && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <TombolSetujuiBatch batchId={batchId} />
        </div>
      )}
    </div>
  );
}
