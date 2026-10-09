"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { InputNominal } from "@/components/forms/input-nominal";
import { konfirmasiKomitmenDanCatatPemasukan, batalkanKomitmenAdmin } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-lg border border-border px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function hariIni(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TombolKonfirmasi({
  komitmenId,
  nominalAwal,
}: {
  komitmenId: string;
  /** Nominal jadwal bayar pertama yang belum lunas (digit string), buat prefill form. "" kalau tidak ada jadwal terbuka. */
  nominalAwal: string;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => konfirmasiKomitmenDanCatatPemasukan(formData),
    STATE_AWAL,
  );

  if (!terbuka) {
    return (
      <Tombol type="button" variant="garis" ukuran="sm" onClick={() => setTerbuka(true)}>
        Konfirmasi
      </Tombol>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-2 rounded-xl border border-border bg-surface-alt/40 p-3">
      <input type="hidden" name="komitmenId" value={komitmenId} />
      <p className="w-full text-left text-[11px] font-semibold text-ink">
        Pemasukan pertama sudah diterima?
      </p>
      <div className="flex w-full flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <InputNominal name="nominal" label="Nominal Diterima" defaultValue={nominalAwal} />
        </div>
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="font-semibold text-ink">Tanggal Transfer</span>
          <input type="date" name="tanggal" required defaultValue={hariIni()} className={KELAS_INPUT} />
        </label>
      </div>
      {state.pesan && (
        <p className={`w-full text-left text-xs ${state.sukses ? "text-green-700" : "text-red-600"}`} role="alert">
          {state.pesan}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Tombol type="button" variant="garis" ukuran="sm" onClick={() => setTerbuka(false)}>
          Batal
        </Tombol>
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm">
          {pending ? "Menyimpan..." : "Konfirmasi & Catat Pemasukan"}
        </Tombol>
      </div>
    </form>
  );
}

export function TombolBatalkan({ komitmenId }: { komitmenId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => batalkanKomitmenAdmin(komitmenId),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Tombol type="submit" disabled={pending} variant="bahaya" ukuran="sm">
        {pending ? "Memproses..." : "Batalkan"}
      </Tombol>
      {state.pesan && !state.sukses && <span className="text-xs text-red-600">{state.pesan}</span>}
    </form>
  );
}
