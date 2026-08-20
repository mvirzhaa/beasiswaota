"use client";

import { useActionState, useState } from "react";
import { formatRupiah } from "@/lib/uang";
import type { HasilAksi } from "@/types/aksi";
import {
  pratinjauImporPotonganGaji,
  komitImporPotonganGaji,
  type HasilPratinjauPotonganGaji,
} from "./actions";

const STATE_PRATINJAU_AWAL: HasilPratinjauPotonganGaji = { sukses: false, pesan: "" };
const STATE_KOMIT_AWAL: HasilAksi = { sukses: false, pesan: "" };

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
    <div className="mt-3 flex flex-col gap-6">
      <form action={actionPratinjau} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Nomor batch</span>
          <input
            value={nomorBatch}
            onChange={(e) => setNomorBatch(e.target.value)}
            placeholder="mis. 2026-08-01"
            required
            className="rounded-lg border border-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>File XLSX realisasi</span>
          <input type="file" name="file" accept=".xlsx" required className="text-sm" />
        </label>
        <button
          type="submit"
          disabled={pendingPratinjau || !nomorBatch.trim()}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          {pendingPratinjau ? "Membaca..." : "Pratinjau"}
        </button>
      </form>

      {statePratinjau.pesan && <p className="text-sm text-muted">{statePratinjau.pesan}</p>}

      {statePratinjau.baris && (
        <div>
          <h3 className="font-semibold">Siap disimpan ({barisValid.length})</h3>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1">Baris</th>
                <th>NIP</th>
                <th>Donatur</th>
                <th>Nominal</th>
              </tr>
            </thead>
            <tbody>
              {barisValid.map((b) => (
                <tr key={b.baris} className="border-b">
                  <td className="py-1">{b.baris}</td>
                  <td>{b.nip}</td>
                  <td>{b.namaDonatur}</td>
                  <td>{formatRupiah(BigInt(b.nominal))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {barisError.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-red-600">Bermasalah ({barisError.length})</h3>
              <ul className="mt-1 text-sm text-red-600">
                {barisError.map((b) => (
                  <li key={b.baris}>
                    Baris {b.baris}: {b.pesanError}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {barisValid.length > 0 && (
            <form action={actionKomit} className="mt-4">
              <input type="hidden" name="dataJson" value={dataJson} />
              <button
                type="submit"
                disabled={pendingKomit}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {pendingKomit ? "Menyimpan..." : `Konfirmasi simpan ${barisValid.length} baris`}
              </button>
              {stateKomit.pesan && (
                <span className={`ml-3 text-sm ${stateKomit.sukses ? "text-green-700" : "text-red-600"}`}>
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
