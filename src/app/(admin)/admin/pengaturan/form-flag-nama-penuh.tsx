"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { setFlagNamaPenuh } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function FormFlagNamaPenuh({ aktifSaatIni }: { aktifSaatIni: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => setFlagNamaPenuh(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/80 bg-surface-alt/30 p-3.5">
      <label className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-ink cursor-pointer select-none">
        <input
          type="checkbox"
          name="aktif"
          defaultChecked={aktifSaatIni}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
        />
        <span>Tampilkan nama penuh mahasiswa (bukan inisial)</span>
      </label>
      <div className="flex items-center gap-3 shrink-0">
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm" className="w-fit font-semibold">
          {pending ? "Menyimpan..." : "Simpan Pengaturan"}
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
