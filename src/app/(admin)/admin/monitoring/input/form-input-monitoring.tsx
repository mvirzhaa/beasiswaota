"use client";

import { useActionState } from "react";
import type { MonitoringAkademik } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { simpanMonitoring } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function FormInputMonitoring({
  mahasiswaList,
  periodeList,
  mahasiswaIdAwal,
  periodeIdAwal,
  existing,
}: {
  mahasiswaList: { id: string; nama: string; nim: string }[];
  periodeList: { id: string; kode: string }[];
  mahasiswaIdAwal?: string;
  periodeIdAwal?: string;
  existing: MonitoringAkademik | null;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => simpanMonitoring(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span>Mahasiswa</span>
        <select name="mahasiswaId" defaultValue={mahasiswaIdAwal} required className="rounded-lg border border-border px-3 py-2">
          <option value="">Pilih mahasiswa</option>
          {mahasiswaList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama} ({m.nim})
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Periode</span>
        <select name="periodeId" defaultValue={periodeIdAwal} required className="rounded-lg border border-border px-3 py-2">
          <option value="">Pilih periode</option>
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>IPK</span>
        <input
          name="ipk"
          defaultValue={existing?.ipk?.toString() ?? ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>IP Semester</span>
        <input
          name="ipSemester"
          defaultValue={existing?.ipSemester?.toString() ?? ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>SKS Semester</span>
        <input
          name="sksSemester"
          defaultValue={existing?.sksSemester?.toString() ?? ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>SKS Kumulatif</span>
        <input
          name="sksKumulatif"
          defaultValue={existing?.sksKumulatif?.toString() ?? ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Status akademik</span>
        <select
          name="statusAkademik"
          defaultValue={existing?.statusAkademik ?? "AKTIF"}
          className="rounded-lg border border-border px-3 py-2"
        >
          <option value="AKTIF">Aktif</option>
          <option value="CUTI">Cuti</option>
          <option value="LULUS">Lulus</option>
          <option value="DO">DO</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Persen kehadiran</span>
        <input
          name="persenKehadiran"
          defaultValue={existing?.persenKehadiran?.toString() ?? ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      {state.pesan && (
        <p className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
