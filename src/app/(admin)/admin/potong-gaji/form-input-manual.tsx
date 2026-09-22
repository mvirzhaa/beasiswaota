"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { InputNominal } from "@/components/forms/input-nominal";
import { catatPotonganGajiManual } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export interface OpsiJadwalPotongGaji {
  id: string;
  label: string;
}

export function FormInputManual({ opsiJadwal }: { opsiJadwal: OpsiJadwalPotongGaji[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => catatPotonganGajiManual(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink">Jadwal Potongan</span>
        <select name="jadwalBayarId" required defaultValue="" className={KELAS_INPUT}>
          <option value="" disabled>
            Pilih donatur & periode...
          </option>
          {opsiJadwal.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <InputNominal name="nominal" label="Nominal Realisasi" />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink">Tanggal Realisasi</span>
        <input type="date" name="tanggal" required className={KELAS_INPUT} />
      </label>

      {state.pesan && (
        <p className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`} role="alert">
          {state.pesan}
        </p>
      )}

      <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm">
        {pending ? "Menyimpan..." : "Catat Realisasi"}
      </Tombol>
    </form>
  );
}
