"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { setujuiPembinaan, tarikPersetujuanPembinaan } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolPersetujuan({ relasiId, disetujui }: { relasiId: string; disetujui: boolean }) {
  const [state, formAction, pending] = useActionState(
    async () => (disetujui ? tarikPersetujuanPembinaan(relasiId) : setujuiPembinaan(relasiId)),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
          disetujui ? "border border-red-600 text-red-600" : "bg-primary text-white"
        }`}
      >
        {pending ? "Memproses..." : disetujui ? "Tarik persetujuan" : "Setujui pemantauan"}
      </button>
      {state.pesan && (
        <span className={`text-xs ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</span>
      )}
    </form>
  );
}
