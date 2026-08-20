"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
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
    <section className="mt-6 flex flex-col gap-4 border-t pt-4">
      <h2 className="text-lg font-semibold">Keputusan</h2>

      <form action={actionVerif}>
        <button
          type="submit"
          disabled={pendingVerif}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pendingVerif ? "Memproses..." : "Verifikasi"}
        </button>
        {stateVerif.pesan && (
          <span className={`ml-2 text-sm ${stateVerif.sukses ? "text-green-700" : "text-red-600"}`}>
            {stateVerif.pesan}
          </span>
        )}
      </form>

      <form action={actionRevisi} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Catatan revisi (wajib)</span>
          <textarea name="catatan" rows={2} className="rounded border px-2 py-1" />
        </label>
        <button
          type="submit"
          disabled={pendingRevisi}
          className="w-fit rounded border border-amber-600 px-4 py-2 text-sm text-amber-700 disabled:opacity-50"
        >
          {pendingRevisi ? "Memproses..." : "Minta revisi"}
        </button>
        {stateRevisi.pesan && (
          <span className={stateRevisi.sukses ? "text-sm text-green-700" : "text-sm text-red-600"}>
            {stateRevisi.pesan}
          </span>
        )}
      </form>
    </section>
  );
}
