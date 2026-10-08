"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { batalkanTagihan } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolBatalkanTagihan({ tagihanId }: { tagihanId: string }) {
  const [state, formAction, pending] = useActionState(async () => batalkanTagihan(tagihanId), STATE_AWAL);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Tombol type="submit" disabled={pending} variant="bahaya" ukuran="sm">
        {pending ? "Memproses..." : "Batalkan"}
      </Tombol>
      {state.pesan && !state.sukses && <span className="text-[11px] text-red-600">{state.pesan}</span>}
    </form>
  );
}
