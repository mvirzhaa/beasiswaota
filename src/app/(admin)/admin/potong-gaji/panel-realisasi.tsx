"use client";

import { useState } from "react";
import { FormImporRealisasi } from "./form-impor-realisasi";
import { FormInputManual, type OpsiJadwalPotongGaji } from "./form-input-manual";

export function PanelRealisasi({ opsiJadwal }: { opsiJadwal: OpsiJadwalPotongGaji[] }) {
  const [mode, setMode] = useState<"impor" | "manual">("impor");

  return (
    <div>
      <div className="mb-4 flex gap-1.5 rounded-xl border border-border bg-surface-alt/40 p-1">
        <button
          type="button"
          onClick={() => setMode("impor")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            mode === "impor" ? "bg-primary text-white shadow-xs" : "text-muted hover:text-ink"
          }`}
        >
          Impor Excel
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            mode === "manual" ? "bg-primary text-white shadow-xs" : "text-muted hover:text-ink"
          }`}
        >
          Input Manual
        </button>
      </div>

      {mode === "impor" ? <FormImporRealisasi /> : <FormInputManual opsiJadwal={opsiJadwal} />}
    </div>
  );
}
