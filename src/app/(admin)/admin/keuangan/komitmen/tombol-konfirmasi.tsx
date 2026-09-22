"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { konfirmasiKomitmen, batalkanKomitmenAdmin } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function TombolKonfirmasi({ komitmenId }: { komitmenId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => konfirmasiKomitmen(komitmenId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Tombol type="submit" disabled={pending} variant="garis" ukuran="sm">
        {pending ? "Memproses..." : "Konfirmasi"}
      </Tombol>
      {state.pesan && !state.sukses && <span className="text-xs text-red-600">{state.pesan}</span>}
    </form>
  );
}

export function TombolBatalkan({ komitmenId }: { komitmenId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => batalkanKomitmenAdmin(komitmenId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Tombol type="submit" disabled={pending} variant="bahaya" ukuran="sm">
        {pending ? "Memproses..." : "Batalkan"}
      </Tombol>
      {state.pesan && !state.sukses && <span className="text-xs text-red-600">{state.pesan}</span>}
    </form>
  );
}
