"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { konfirmasiKomitmen } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolKonfirmasi({ komitmenId }: { komitmenId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => konfirmasiKomitmen(komitmenId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Konfirmasi"}
      </button>
      {state.pesan && !state.sukses && (
        <span className="text-sm text-red-600">{state.pesan}</span>
      )}
    </form>
  );
}
