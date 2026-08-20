"use client";

import { useActionState, useRef } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { kirimPesanMahasiswa } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function FormKirimPesan({ relasiId }: { relasiId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await kirimPesanMahasiswa(relasiId, formData);
      if (hasil.sukses) formRef.current?.reset();
      return hasil;
    },
    STATE_AWAL,
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <textarea
        name="isi"
        rows={3}
        required
        placeholder="Tulis pesan untuk Orang Tua Asuh (ucapan terima kasih, kabar studi, dsb)..."
        className="w-full rounded-xl border border-border bg-surface-alt/50 p-3 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {state.pesan && (
        <div
          className={`flex items-start gap-2 rounded-xl p-2.5 text-xs ${
            state.sukses
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.sukses ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{state.pesan}</span>
        </div>
      )}
      <div className="flex justify-end">
        <Tombol
          type="submit"
          disabled={pending}
          variant="primer"
          ukuran="sm"
        >
          <Send className="h-4 w-4" />
          <span>{pending ? "Mengirim Pesan..." : "Kirim Pesan"}</span>
        </Tombol>
      </div>
    </form>
  );
}
