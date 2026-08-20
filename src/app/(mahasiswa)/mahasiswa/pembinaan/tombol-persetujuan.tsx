"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { Check, X, ShieldCheck } from "lucide-react";
import { setujuiPembinaan, tarikPersetujuanPembinaan } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolPersetujuan({ relasiId, disetujui }: { relasiId: string; disetujui: boolean }) {
  const [state, formAction, pending] = useActionState(
    async () => (disetujui ? tarikPersetujuanPembinaan(relasiId) : setujuiPembinaan(relasiId)),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Tombol
        type="submit"
        disabled={pending}
        variant={disetujui ? "bahaya" : "primer"}
        ukuran="sm"
      >
        {disetujui ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
        <span>{pending ? "Memproses..." : disetujui ? "Tarik Persetujuan" : "Setujui Pemantauan"}</span>
      </Tombol>
      {state.pesan && (
        <span className={`text-xs font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </span>
      )}
    </form>
  );
}
