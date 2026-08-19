"use client";

import { useActionState } from "react";
import type { ambilPengajuanDetailAdmin } from "@/server/queries/pengajuan";
import { LABEL_JENIS_BERKAS } from "@/lib/pengajuan/schema";
import type { HasilAksi } from "@/types/aksi";
import {
  tandaiBerkas,
  setSkorManual,
  setujuiPengajuan,
  tolakPengajuan,
} from "../actions";

type PengajuanDetail = NonNullable<
  Awaited<ReturnType<typeof ambilPengajuanDetailAdmin>>
>;

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function PanelVerifikasi({ pengajuan }: { pengajuan: PengajuanDetail }) {
  const bisaDiputuskan =
    pengajuan.status === "DIAJUKAN" || pengajuan.status === "VERIFIKASI_BERKAS";

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold">Data pengajuan</h2>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Status</dt>
          <dd>{pengajuan.status}</dd>
          <dt className="text-gray-500">Nominal kebutuhan</dt>
          <dd>Rp{pengajuan.nominalKebutuhan.toString()}</dd>
          <dt className="text-gray-500">Penghasilan orang tua</dt>
          <dd>Rp{pengajuan.penghasilanOrtu.toString()}</dd>
          <dt className="text-gray-500">Jumlah tanggungan</dt>
          <dd>{pengajuan.jmlTanggungan}</dd>
          <dt className="text-gray-500">Status orang tua</dt>
          <dd>{pengajuan.statusOrtu}</dd>
        </dl>
        <p className="mt-2 text-sm">
          <span className="text-gray-500">Alasan: </span>
          {pengajuan.alasan}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Berkas</h2>
        <div className="mt-2 flex flex-col gap-2">
          {pengajuan.berkas.map((b) => (
            <BarisBerkas key={b.id} id={b.id} jenis={b.jenis} status={b.status} />
          ))}
          {pengajuan.berkas.length === 0 && (
            <p className="text-sm text-gray-500">Belum ada berkas diunggah.</p>
          )}
        </div>
      </section>

      <SkorManual pengajuanId={pengajuan.id} skorSaatIni={pengajuan.skor?.toString()} />

      {bisaDiputuskan && <Keputusan pengajuanId={pengajuan.id} />}
    </div>
  );
}

function BarisBerkas({
  id,
  jenis,
  status,
}: {
  id: string;
  jenis: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const statusBaru = formData.get("statusBaru") as "VALID" | "TIDAK_VALID";
      return tandaiBerkas(id, statusBaru);
    },
    STATE_AWAL,
  );

  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 text-sm">
      <div>
        <p className="font-medium">{LABEL_JENIS_BERKAS[jenis] ?? jenis}</p>
        <p className="text-gray-500">
          Status: {status} {state.pesan && `· ${state.pesan}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`/api/berkas/${id}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Lihat
        </a>
        <form action={formAction}>
          <input type="hidden" name="statusBaru" value="VALID" />
          <button type="submit" disabled={pending} className="rounded border px-2 py-1">
            Valid
          </button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="statusBaru" value="TIDAK_VALID" />
          <button type="submit" disabled={pending} className="rounded border px-2 py-1">
            Tidak valid
          </button>
        </form>
      </div>
    </div>
  );
}

function SkorManual({
  pengajuanId,
  skorSaatIni,
}: {
  pengajuanId: string;
  skorSaatIni?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      setSkorManual(pengajuanId, formData.get("skor")),
    STATE_AWAL,
  );

  return (
    <section>
      <h2 className="text-lg font-semibold">Skor (manual)</h2>
      <p className="text-sm text-gray-500">
        Skoring otomatis belum aktif — isi manual untuk sementara.
      </p>
      <form action={formAction} className="mt-2 flex items-center gap-2">
        <input
          name="skor"
          type="number"
          min={0}
          max={100}
          step="0.01"
          defaultValue={skorSaatIni ?? ""}
          className="w-24 rounded border px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan skor"}
        </button>
        {state.pesan && (
          <span className={state.sukses ? "text-green-700" : "text-red-600"}>
            {state.pesan}
          </span>
        )}
      </form>
    </section>
  );
}

function Keputusan({ pengajuanId }: { pengajuanId: string }) {
  const [stateSetuju, actionSetuju, pendingSetuju] = useActionState(
    async () => setujuiPengajuan(pengajuanId),
    STATE_AWAL,
  );
  const [stateTolak, actionTolak, pendingTolak] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      tolakPengajuan(pengajuanId, { catatan: formData.get("catatan") }),
    STATE_AWAL,
  );

  return (
    <section className="flex flex-col gap-4 border-t pt-4">
      <h2 className="text-lg font-semibold">Keputusan</h2>

      <form action={actionSetuju}>
        <button
          type="submit"
          disabled={pendingSetuju}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pendingSetuju ? "Memproses..." : "Setujui pengajuan"}
        </button>
        {stateSetuju.pesan && (
          <span
            className={`ml-2 text-sm ${stateSetuju.sukses ? "text-green-700" : "text-red-600"}`}
          >
            {stateSetuju.pesan}
          </span>
        )}
      </form>

      <form action={actionTolak} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Catatan penolakan (wajib)</span>
          <textarea name="catatan" rows={2} className="rounded border px-2 py-1" />
        </label>
        <button
          type="submit"
          disabled={pendingTolak}
          className="w-fit rounded border border-red-600 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
        >
          {pendingTolak ? "Memproses..." : "Tolak pengajuan"}
        </button>
        {stateTolak.pesan && (
          <span className={stateTolak.sukses ? "text-green-700" : "text-red-600"}>
            {stateTolak.pesan}
          </span>
        )}
      </form>
    </section>
  );
}
