"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { tugaskanRelasi } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

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
    <form action={formAction} className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-ink">Donatur</span>
        <select name="ortuAsuhId" required className={KELAS_INPUT}>
          {ortuAsuhList.map((o) => (
            <option key={o.id} value={o.id}>
              {o.atasNamaMunfiq || o.nama}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-ink">Mahasiswa Binaan</span>
        <select name="mahasiswaId" required className={KELAS_INPUT}>
          {mahasiswaList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama} ({m.nim}) — {m.prodi}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-xs font-semibold text-ink">Periode Mulai</span>
        <select name="periodeMulaiId" required className={KELAS_INPUT}>
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="text-xs font-semibold text-ink">Catatan (Opsional)</span>
        <textarea name="catatan" rows={2} className={KELAS_INPUT} />
      </label>

      {state.pesan && (
        <p className={`text-sm sm:col-span-2 ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</p>
      )}

      <div className="sm:col-span-2">
        <Tombol type="submit" disabled={pending} variant="primer">
          {pending ? "Menugaskan..." : "Tugaskan"}
        </Tombol>
      </div>
    </form>
  );
}
