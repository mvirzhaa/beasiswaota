"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { simpanPimpinanLanding } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };
const KELAS_INPUT =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

export function FormPimpinanLanding({ pesan }: { pesan: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => simpanPimpinanLanding(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
        <span>Pesan Amanah & Komitmen Pimpinan UIKA</span>
        <textarea name="pesan" required rows={3} defaultValue={pesan} className={KELAS_INPUT} />
      </label>
      <div className="flex items-center justify-between pt-1">
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm" className="w-fit font-semibold">
          {pending ? "Menyimpan..." : "Simpan Pesan Pimpinan"}
        </Tombol>
        {state.pesan && (
          <span className={`text-xs font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>
            {state.pesan}
          </span>
        )}
      </div>
    </form>
  );
}
