"use client";

import { useActionState, useState } from "react";
import type { HasilAksi } from "@/types/aksi";
import {
  pratinjauImporMonitoring,
  komitImporMonitoring,
  type HasilPratinjauImpor,
} from "../actions";

const STATE_PRATINJAU_AWAL: HasilPratinjauImpor = { sukses: false, pesan: "" };
const STATE_KOMIT_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function FormImporMonitoring({ periodeList }: { periodeList: { id: string; kode: string }[] }) {
  const [periodeId, setPeriodeId] = useState(periodeList[0]?.id ?? "");

  const [statePratinjau, actionPratinjau, pendingPratinjau] = useActionState(
    async (_prev: HasilPratinjauImpor, formData: FormData) =>
      pratinjauImporMonitoring(periodeId, formData),
    STATE_PRATINJAU_AWAL,
  );

  const [stateKomit, actionKomit, pendingKomit] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      komitImporMonitoring(periodeId, formData.get("dataJson") as string),
    STATE_KOMIT_AWAL,
  );

  if (periodeList.length === 0) {
    return <p className="mt-4 text-sm text-gray-500">Belum ada periode.</p>;
  }

  const barisValid = (statePratinjau.valid ?? []).filter((v) => v.mahasiswaId !== null);
  const dataJson = JSON.stringify(barisValid);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <form action={actionPratinjau} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Periode</span>
          <select
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value)}
            className="rounded border px-3 py-2"
          >
            {periodeList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kode}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>File XLSX</span>
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pendingPratinjau}
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          {pendingPratinjau ? "Membaca..." : "Pratinjau"}
        </button>
      </form>

      {statePratinjau.pesan && <p className="text-sm text-gray-700">{statePratinjau.pesan}</p>}

      {statePratinjau.valid && (
        <div>
          <h2 className="text-lg font-semibold">Pratinjau ({barisValid.length} siap disimpan)</h2>
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1">Baris</th>
                <th>NIM</th>
                <th>Nama</th>
                <th>IPK</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {barisValid.map((v) => (
                <tr key={v.baris} className="border-b">
                  <td className="py-1">{v.baris}</td>
                  <td>{v.nim}</td>
                  <td>{v.namaMahasiswa}</td>
                  <td>{v.ipk ?? "-"}</td>
                  <td>{v.statusAkademik}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {statePratinjau.error && statePratinjau.error.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-red-600">
                Baris bermasalah ({statePratinjau.error.length})
              </h3>
              <ul className="mt-1 text-sm text-red-600">
                {statePratinjau.error.map((e) => (
                  <li key={e.baris}>
                    Baris {e.baris}: {e.pesan}
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
                className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
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
