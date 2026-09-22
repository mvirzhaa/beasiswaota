"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { verifikasiLaporan, mintaRevisiLaporan } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function PanelReviewLaporan({ laporanId }: { laporanId: string }) {
  const [stateVerif, actionVerif, pendingVerif] = useActionState(
    async () => verifikasiLaporan(laporanId),
    STATE_AWAL,
  );
  const [stateRevisi, actionRevisi, pendingRevisi] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      mintaRevisiLaporan(laporanId, { catatan: formData.get("catatan") }),
    STATE_AWAL,
  );

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface p-6">
      <h2 className="border-b border-border pb-3 font-heading text-base font-bold text-ink">Keputusan</h2>

      <div className="mt-4 flex flex-col gap-5">
        <form action={actionVerif} className="flex items-center gap-2.5">
          <Tombol type="submit" disabled={pendingVerif} variant="primer">
            <CheckCircle2 className="h-4 w-4" />
            <span>{pendingVerif ? "Memproses..." : "Verifikasi"}</span>
          </Tombol>
          {stateVerif.pesan && (
            <span className={`text-xs font-medium ${stateVerif.sukses ? "text-green-700" : "text-red-600"}`}>
              {stateVerif.pesan}
            </span>
          )}
        </form>

        <form action={actionRevisi} className="flex flex-col gap-2.5 border-t border-border pt-5">
          <label className="flex flex-col gap-1.5 text-[13px]">
            <span className="font-semibold text-ink">Catatan Revisi (wajib)</span>
            <textarea
              name="catatan"
              rows={2}
              className="rounded-[10px] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <div className="flex items-center gap-2.5">
            <Tombol type="submit" disabled={pendingRevisi} variant="garis" className="w-fit border-amber-300 text-amber-700 hover:bg-amber-50">
              <RotateCcw className="h-4 w-4" />
              <span>{pendingRevisi ? "Memproses..." : "Minta Revisi"}</span>
            </Tombol>
            {stateRevisi.pesan && (
              <span className={`text-xs font-medium ${stateRevisi.sukses ? "text-green-700" : "text-red-600"}`}>
                {stateRevisi.pesan}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
