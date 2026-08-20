"use client";

import { useActionState } from "react";
import { mulaiPembayaranVA, type HasilMulaiPembayaranVA } from "./actions";

const STATE_AWAL: HasilMulaiPembayaranVA = { sukses: false, pesan: "" };

export function TombolBayarVA({ jadwalBayarId }: { jadwalBayarId: string }) {
  const [state, formAction, pending] = useActionState(async () => {
    const hasil = await mulaiPembayaranVA(jadwalBayarId);
    if (hasil.sukses && hasil.redirectUrl) {
      window.location.href = hasil.redirectUrl;
    }
    return hasil;
  }, STATE_AWAL);

  return (
    <form action={formAction} className="inline">
      <button type="submit" disabled={pending} className="text-xs underline disabled:opacity-50">
        {pending ? "Menyiapkan..." : "Bayar via Midtrans"}
      </button>
      {state.pesan && !state.sukses && (
        <span className="ml-2 text-xs text-red-600">{state.pesan}</span>
      )}
    </form>
  );
}
