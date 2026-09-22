"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { simpanKontakLanding } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };
const KELAS_INPUT =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

export function FormKontakLanding({ kontak }: { kontak: Array<{ nama: string; nomor: string }> }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => simpanKontakLanding(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {kontak.map((k, i) => (
          <div key={i} className="rounded-xl border border-border/80 bg-surface-alt/30 p-3 flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Kontak WA {i + 1}</p>
            <label className="flex flex-col gap-1 text-xs font-medium text-ink">
              <span>Nama Lengkap</span>
              <input name={`nama${i}`} required defaultValue={k.nama} placeholder="Nama Pengelola" className={KELAS_INPUT} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-ink">
              <span>Nomor WhatsApp</span>
              <input
                name={`nomor${i}`}
                required
                defaultValue={k.nomor}
                placeholder="0813-xxxx-xxxx"
                className={KELAS_INPUT}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm" className="w-fit font-semibold">
          {pending ? "Menyimpan..." : "Simpan Kontak"}
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
