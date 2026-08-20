"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { tugaskanRelasi } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

type OrtuAsuhOpsi = { id: string; nama: string; atasNamaMunfiq: string | null };
type MahasiswaOpsi = { id: string; nama: string; nim: string; prodi: string };
type PeriodeOpsi = { id: string; kode: string };

export function FormTugaskan({
  ortuAsuhList,
  mahasiswaList,
  periodeList,
}: {
  ortuAsuhList: OrtuAsuhOpsi[];
  mahasiswaList: MahasiswaOpsi[];
  periodeList: PeriodeOpsi[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => tugaskanRelasi(formData),
    STATE_AWAL,
  );

  if (ortuAsuhList.length === 0 || mahasiswaList.length === 0 || periodeList.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted">
        Butuh minimal satu donatur, satu mahasiswa aktif, dan satu periode untuk menugaskan relasi.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span>Donatur</span>
        <select name="ortuAsuhId" required className="rounded-lg border border-border px-3 py-2">
          {ortuAsuhList.map((o) => (
            <option key={o.id} value={o.id}>
              {o.atasNamaMunfiq || o.nama}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Mahasiswa binaan</span>
        <select name="mahasiswaId" required className="rounded-lg border border-border px-3 py-2">
          {mahasiswaList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama} ({m.nim}) — {m.prodi}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Periode mulai</span>
        <select name="periodeMulaiId" required className="rounded-lg border border-border px-3 py-2">
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>Catatan (opsional)</span>
        <textarea name="catatan" rows={2} className="rounded-lg border border-border px-3 py-2" />
      </label>

      {state.pesan && (
        <p className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Menugaskan..." : "Tugaskan"}
      </button>
    </form>
  );
}
