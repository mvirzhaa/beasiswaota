"use client";

import { useActionState } from "react";
import { CreditCard } from "lucide-react";
import { Tombol } from "@/components/ui/tombol";
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
    <form action={formAction} className="inline-flex items-center gap-1.5">
      <Tombol
        type="submit"
        disabled={pending}
        variant="aksen"
        ukuran="sm"
        className="text-xs"
      >
        <CreditCard className="h-3.5 w-3.5" />
        <span>{pending ? "Menyiapkan..." : "Bayar Online"}</span>
      </Tombol>
      {state.pesan && !state.sukses && (
        <span className="text-xs text-red-600">{state.pesan}</span>
      )}
    </form>
  );
}
