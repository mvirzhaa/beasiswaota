"use client";

import { useActionState, useRef } from "react";
import type { HasilAksi } from "@/types/aksi";
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
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <textarea name="isi" rows={3} required className="rounded border px-3 py-2 text-sm" />
      {state.pesan && (
        <p className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Kirim"}
      </button>
    </form>
  );
}
