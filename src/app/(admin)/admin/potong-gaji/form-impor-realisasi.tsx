"use client";

import { useActionState, useState } from "react";
import { formatRupiah } from "@/lib/uang";
import { Tombol } from "@/components/ui/tombol";
import type { HasilAksi } from "@/types/aksi";
import {
  pratinjauImporPotonganGaji,
  komitImporPotonganGaji,
  type HasilPratinjauPotonganGaji,
} from "./actions";

const STATE_PRATINJAU_AWAL: HasilPratinjauPotonganGaji = { sukses: false, pesan: "" };
const STATE_KOMIT_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-[10px] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function FormImporRealisasi() {
  const [nomorBatch, setNomorBatch] = useState("");

  const [statePratinjau, actionPratinjau, pendingPratinjau] = useActionState(
    async (_prev: HasilPratinjauPotonganGaji, formData: FormData) =>
      pratinjauImporPotonganGaji(formData),
    STATE_PRATINJAU_AWAL,
  );
  const [stateKomit, actionKomit, pendingKomit] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      komitImporPotonganGaji(nomorBatch, formData.get("dataJson") as string),
    STATE_KOMIT_AWAL,
  );

  const barisValid = (statePratinjau.baris ?? []).filter((b) => b.valid);
  const barisError = (statePratinjau.baris ?? []).filter((b) => !b.valid);
  const dataJson = JSON.stringify(statePratinjau.baris ?? []);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <form action={actionPratinjau} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold text-ink">Nomor Batch</span>
          <input
            value={nomorBatch}
            onChange={(e) => setNomorBatch(e.target.value)}
            placeholder="mis. 2026-08-01"
            required
            className={KELAS_INPUT}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]">
          <span className="font-semibold text-ink">File XLSX Realisasi</span>
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink hover:file:bg-primary-light"
          />
        </label>
        <Tombol type="submit" disabled={pendingPratinjau || !nomorBatch.trim()} variant="garis">
          {pendingPratinjau ? "Membaca..." : "Pratinjau"}
        </Tombol>
      </form>

      {statePratinjau.pesan && <p className="text-[13px] text-muted">{statePratinjau.pesan}</p>}

      {statePratinjau.baris && (
        <div>
          <h3 className="text-[13px] font-bold text-ink">Siap Disimpan ({barisValid.length})</h3>
          <div className="mt-2 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-alt text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="py-2 px-3">Baris</th>
                  <th className="py-2 px-3">NIP</th>
                  <th className="py-2 px-3">Donatur</th>
                  <th className="py-2 px-3">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {barisValid.map((b) => (
                  <tr key={b.baris}>
                    <td className="py-2 px-3 text-muted">{b.baris}</td>
                    <td className="py-2 px-3 text-muted">{b.nip}</td>
                    <td className="py-2 px-3 font-semibold text-ink">{b.namaDonatur}</td>
                    <td className="py-2 px-3 font-semibold text-primary">{formatRupiah(BigInt(b.nominal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {barisError.length > 0 && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <h3 className="text-xs font-bold text-red-700">Bermasalah ({barisError.length})</h3>
              <ul className="mt-1.5 flex flex-col gap-1 text-xs text-red-700">
                {barisError.map((b) => (
                  <li key={b.baris}>
                    Baris {b.baris}: {b.pesanError}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {barisValid.length > 0 && (
            <form action={actionKomit} className="mt-4 flex items-center gap-2.5">
              <input type="hidden" name="dataJson" value={dataJson} />
              <Tombol type="submit" disabled={pendingKomit} variant="primer">
                {pendingKomit ? "Menyimpan..." : `Konfirmasi Simpan ${barisValid.length} Baris`}
              </Tombol>
              {stateKomit.pesan && (
                <span className={`text-xs font-medium ${stateKomit.sukses ? "text-green-700" : "text-red-600"}`}>
                  {stateKomit.pesan}
                </span>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
