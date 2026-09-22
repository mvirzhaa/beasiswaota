"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { ShieldCheck } from "lucide-react";
import { setujuiBatchAlokasi } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolSetujuiBatch({ batchId }: { batchId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => setujuiBatchAlokasi(batchId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <Tombol type="submit" disabled={pending} variant="primer">
        <ShieldCheck className="h-4 w-4" />
        <span>{pending ? "Memproses..." : "Setujui Batch"}</span>
      </Tombol>
      {state.pesan && (
        <span className={`text-sm font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </span>
      )}
    </form>
  );
}
