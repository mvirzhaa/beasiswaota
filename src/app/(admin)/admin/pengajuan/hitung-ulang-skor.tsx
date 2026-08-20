"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { hitungUlangSkor } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolHitungUlangSkor({ periodeId }: { periodeId?: string }) {
  const [state, formAction, pending] = useActionState(
    async () => hitungUlangSkor(periodeId),
    STATE_AWAL,
  );

  if (!periodeId) {
    return (
      <p className="text-sm text-muted">
        Pilih satu periode di atas untuk bisa menghitung ulang skor.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50"
      >
        {pending ? "Menghitung..." : "Hitung ulang skor periode ini"}
      </button>
      {state.pesan && (
        <span className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </span>
      )}
    </form>
  );
}
