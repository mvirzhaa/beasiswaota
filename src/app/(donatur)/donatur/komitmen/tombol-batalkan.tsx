"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { batalkanKomitmen } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolBatalkanKomitmen({ komitmenId }: { komitmenId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => batalkanKomitmen(komitmenId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-red-600 px-3 py-1 text-sm text-red-600 disabled:opacity-50"
      >
        {pending ? "Membatalkan..." : "Batalkan komitmen"}
      </button>
      {state.pesan && (
        <span className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </span>
      )}
    </form>
  );
}
