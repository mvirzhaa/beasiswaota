"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { batalkanKomitmen } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolBatalkanKomitmen({ komitmenId }: { komitmenId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => batalkanKomitmen(komitmenId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Tombol
        type="submit"
        disabled={pending}
        variant="bahaya"
        ukuran="sm"
      >
        {pending ? "Membatalkan..." : "Batalkan Komitmen"}
      </Tombol>
      {state.pesan && (
        <span className={`text-xs ${state.sukses ? "text-green-700 font-medium" : "text-red-600"}`}>
          {state.pesan}
        </span>
      )}
    </form>
  );
}
