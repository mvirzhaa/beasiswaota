"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { simpanPilarLanding } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };
const KELAS_INPUT =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

export function FormPilarLanding({ pilar }: { pilar: Array<{ judul: string; deskripsi: string }> }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => simpanPilarLanding(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pilar.map((p, i) => (
          <div key={i} className="rounded-xl border border-border/80 bg-surface-alt/30 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Pilar {i + 1}</span>
            </div>
            <input
              name={`judul${i}`}
              required
              defaultValue={p.judul}
              placeholder="Judul Pilar"
              className={KELAS_INPUT}
            />
            <textarea
              name={`deskripsi${i}`}
              required
              rows={2}
              defaultValue={p.deskripsi}
              placeholder="Deskripsi Pilar"
              className={KELAS_INPUT}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm" className="w-fit font-semibold">
          {pending ? "Menyimpan..." : "Simpan 4 Pilar"}
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
