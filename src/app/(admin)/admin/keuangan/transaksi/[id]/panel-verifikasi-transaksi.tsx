"use client";

import { useActionState } from "react";
import type { Periode } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifikasiTransaksi, tolakTransaksi } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-[10px] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

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
    <div className="mt-5 rounded-2xl border border-border bg-surface p-6">
      <h2 className="border-b border-border pb-3 font-heading text-base font-bold text-ink">Keputusan</h2>

      <div className="mt-4 flex flex-col gap-5">
        <form action={actionVerifikasi} className="flex flex-col gap-2.5">
          {butuhPeriode && (
            <label className="flex flex-col gap-1.5 text-[13px]">
              <span className="font-semibold text-ink">Periode Tujuan Dana</span>
              <select name="periodeId" required className={KELAS_INPUT}>
                <option value="">Pilih periode</option>
                {periodeList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kode}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex items-center gap-2.5">
            <Tombol type="submit" disabled={pendingVerifikasi} variant="primer" className="w-fit">
              <CheckCircle2 className="h-4 w-4" />
              <span>{pendingVerifikasi ? "Memproses..." : "Verifikasi"}</span>
            </Tombol>
            {stateVerifikasi.pesan && (
              <span className={`text-xs font-medium ${stateVerifikasi.sukses ? "text-green-700" : "text-red-600"}`}>
                {stateVerifikasi.pesan}
              </span>
            )}
          </div>
        </form>

        <form action={actionTolak} className="flex flex-col gap-2.5 border-t border-border pt-5">
          <label className="flex flex-col gap-1.5 text-[13px]">
            <span className="font-semibold text-ink">Alasan Penolakan (wajib)</span>
            <textarea name="catatan" rows={2} className={KELAS_INPUT} />
          </label>
          <div className="flex items-center gap-2.5">
            <Tombol type="submit" disabled={pendingTolak} variant="bahaya" className="w-fit">
              <XCircle className="h-4 w-4" />
              <span>{pendingTolak ? "Memproses..." : "Tolak"}</span>
            </Tombol>
            {stateTolak.pesan && (
              <span className={`text-xs font-medium ${stateTolak.sukses ? "text-green-700" : "text-red-600"}`}>
                {stateTolak.pesan}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
