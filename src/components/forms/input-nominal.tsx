"use client";

import { useState } from "react";

// Input nominal Rupiah: hanya menerima digit, tampilan diberi pemisah ribuan
// lewat manipulasi string (regex), BUKAN Number()/parseFloat() — konsisten
// dengan aturan keras #1 (tidak ada float di jalur nominal). Nilai submit
// (name={name}) berupa string digit murni, diparse ulang server-side lewat
// parseRupiah() di src/lib/uang.ts.

function keDigitSaja(nilai: string): string {
  return nilai.replace(/\D/g, "");
}

function formatRibuan(digit: string): string {
  return digit.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function InputNominal({
  name,
  label,
  hint,
  required = true,
  defaultValue = "",
}: {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [tampilan, setTampilan] = useState(formatRibuan(keDigitSaja(defaultValue)));
  const digit = keDigitSaja(tampilan);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={tampilan}
          onChange={(e) => setTampilan(formatRibuan(keDigitSaja(e.target.value)))}
          placeholder="50.000"
          aria-required={required}
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3.5 text-sm text-ink placeholder:text-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {/* Nilai yang benar-benar dikirim ke server: digit murni tanpa titik.
            Browser tidak memvalidasi `required` pada input hidden, jadi
            validasi wajib-isi dilakukan di server (Zod). */}
        <input type="hidden" name={name} value={digit} />
      </div>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </label>
  );
}
