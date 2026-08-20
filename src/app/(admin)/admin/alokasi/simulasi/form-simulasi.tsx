"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Periode } from "@prisma/client";
import { formatRupiah } from "@/lib/uang";
import { simulasiAlokasi, eksekusiAlokasi, type HasilSimulasi, type HasilEksekusi } from "../actions";

const STATE_SIMULASI_AWAL: HasilSimulasi = { sukses: false, pesan: "" };
const STATE_EKSEKUSI_AWAL: HasilEksekusi = { sukses: false, pesan: "" };

export function FormSimulasi({ periodeList }: { periodeList: Periode[] }) {
  const [stateSimulasi, actionSimulasi, pendingSimulasi] = useActionState(
    async (_prev: HasilSimulasi, formData: FormData) =>
      simulasiAlokasi(formData.get("periodeId") as string),
    STATE_SIMULASI_AWAL,
  );
  const [stateEksekusi, actionEksekusi, pendingEksekusi] = useActionState(
    async (_prev: HasilEksekusi, formData: FormData) =>
      eksekusiAlokasi(formData.get("periodeId") as string),
    STATE_EKSEKUSI_AWAL,
  );

  if (periodeList.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">
        Belum ada periode berstatus SELEKSI/PENYALURAN yang bisa dijalankan.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-6">
      <form className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Periode</span>
          <select name="periodeId" className="rounded border px-3 py-2">
            {periodeList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kode} ({p.status})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          formAction={actionSimulasi}
          disabled={pendingSimulasi || pendingEksekusi}
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          {pendingSimulasi ? "Menyimulasikan..." : "Simulasikan"}
        </button>
        <button
          type="submit"
          formAction={actionEksekusi}
          disabled={pendingSimulasi || pendingEksekusi}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pendingEksekusi ? "Menjalankan..." : "Jalankan (tulis batch DRAFT)"}
        </button>
      </form>

      {stateEksekusi.pesan && (
        <p className={`text-sm ${stateEksekusi.sukses ? "text-green-700" : "text-red-600"}`}>
          {stateEksekusi.pesan}
          {stateEksekusi.batchId && (
            <>
              {" "}
              <Link href={`/admin/alokasi/${stateEksekusi.batchId}`} className="underline">
                Review batch
              </Link>
            </>
          )}
        </p>
      )}

      {stateSimulasi.pesan && (
        <p className={`text-sm ${stateSimulasi.sukses ? "text-green-700" : "text-red-600"}`}>
          {stateSimulasi.pesan}
        </p>
      )}

      {stateSimulasi.rencana && (
        <HasilSimulasiTampil
          rencana={stateSimulasi.rencana}
          mahasiswaMap={stateSimulasi.mahasiswaMap ?? {}}
        />
      )}
    </div>
  );
}

function HasilSimulasiTampil({
  rencana,
  mahasiswaMap,
}: {
  rencana: NonNullable<HasilSimulasi["rencana"]>;
  mahasiswaMap: Record<string, { nama: string; nim: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <dt className="text-gray-500">Saldo awal</dt>
        <dd>{formatRupiah(rencana.saldoAwal)}</dd>
        <dt className="text-gray-500">Total dialokasikan</dt>
        <dd>{formatRupiah(rencana.totalDialokasikan)}</dd>
        <dt className="text-gray-500">Saldo akhir (digulirkan)</dt>
        <dd>{formatRupiah(rencana.saldoAkhir)}</dd>
        <dt className="text-gray-500">Mode</dt>
        <dd>{rencana.mode}</dd>
      </dl>

      <div>
        <h2 className="text-lg font-semibold">Calon penerima ({rencana.penerima.length})</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1">Peringkat</th>
              <th>Mahasiswa</th>
              <th>Skor</th>
              <th>Nominal</th>
              <th>Sumber dana</th>
            </tr>
          </thead>
          <tbody>
            {rencana.penerima.map((p) => (
              <tr key={p.tagihanId} className="border-b">
                <td className="py-1">#{p.ranking}</td>
                <td>
                  {mahasiswaMap[p.mahasiswaId]
                    ? `${mahasiswaMap[p.mahasiswaId].nama} (${mahasiswaMap[p.mahasiswaId].nim})`
                    : p.mahasiswaId}
                </td>
                <td>{p.skor}</td>
                <td>{formatRupiah(p.nominal)}</td>
                <td>{p.sumber.length} transaksi</td>
              </tr>
            ))}
            {rencana.penerima.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-center text-gray-500">
                  Tidak ada penerima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Antrian belum kebagian ({rencana.antrian.length})</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1">Peringkat</th>
              <th>Mahasiswa</th>
              <th>Skor</th>
              <th>Sisa tagihan</th>
              <th>Alasan</th>
            </tr>
          </thead>
          <tbody>
            {rencana.antrian.map((a) => (
              <tr key={a.tagihanId} className="border-b">
                <td className="py-1">#{a.ranking}</td>
                <td>
                  {mahasiswaMap[a.mahasiswaId]
                    ? `${mahasiswaMap[a.mahasiswaId].nama} (${mahasiswaMap[a.mahasiswaId].nim})`
                    : a.mahasiswaId}
                </td>
                <td>{a.skor}</td>
                <td>{formatRupiah(a.sisaTagihan)}</td>
                <td>{a.alasan}</td>
              </tr>
            ))}
            {rencana.antrian.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-center text-gray-500">
                  Tidak ada antrian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
