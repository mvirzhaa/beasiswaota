"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { setujuiBatchAlokasi } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolSetujuiBatch({ batchId }: { batchId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => setujuiBatchAlokasi(batchId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Setujui batch"}
      </button>
      {state.pesan && (
        <span className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </span>
      )}
    </form>
  );
}
