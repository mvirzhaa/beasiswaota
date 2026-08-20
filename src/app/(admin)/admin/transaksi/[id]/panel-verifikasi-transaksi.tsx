"use client";

import { useActionState } from "react";
import type { Periode } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { verifikasiTransaksi, tolakTransaksi } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function PanelVerifikasiTransaksi({
  transaksiId,
  butuhPeriode,
  periodeList,
}: {
  transaksiId: string;
  butuhPeriode: boolean;
  periodeList: Periode[];
}) {
  const [stateVerifikasi, actionVerifikasi, pendingVerifikasi] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      verifikasiTransaksi(transaksiId, formData.get("periodeId") || undefined),
    STATE_AWAL,
  );
  const [stateTolak, actionTolak, pendingTolak] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      tolakTransaksi(transaksiId, { catatan: formData.get("catatan") }),
    STATE_AWAL,
  );

  return (
    <section className="mt-6 flex flex-col gap-4 border-t pt-4">
      <h2 className="text-lg font-semibold">Keputusan</h2>

      <form action={actionVerifikasi} className="flex flex-col gap-2">
        {butuhPeriode && (
          <label className="flex flex-col gap-1 text-sm">
            <span>Periode tujuan dana</span>
            <select name="periodeId" required className="rounded border px-2 py-1">
              <option value="">Pilih periode</option>
              {periodeList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.kode}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          disabled={pendingVerifikasi}
          className="w-fit rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pendingVerifikasi ? "Memproses..." : "Verifikasi"}
        </button>
        {stateVerifikasi.pesan && (
          <span className={stateVerifikasi.sukses ? "text-sm text-green-700" : "text-sm text-red-600"}>
            {stateVerifikasi.pesan}
          </span>
        )}
      </form>

      <form action={actionTolak} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Alasan penolakan (wajib)</span>
          <textarea name="catatan" rows={2} className="rounded border px-2 py-1" />
        </label>
        <button
          type="submit"
          disabled={pendingTolak}
          className="w-fit rounded border border-red-600 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
        >
          {pendingTolak ? "Memproses..." : "Tolak"}
        </button>
        {stateTolak.pesan && (
          <span className={stateTolak.sukses ? "text-sm text-green-700" : "text-sm text-red-600"}>
            {stateTolak.pesan}
          </span>
        )}
      </form>
    </section>
  );
}
