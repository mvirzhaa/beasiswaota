"use client";

import { useActionState, useState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import { alihkanRelasi, akhiriRelasi } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT_KECIL =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const LABEL_STATUS: Record<string, string> = {
  AKTIF: "Aktif",
  SELESAI: "Selesai",
  DIALIHKAN: "Dialihkan",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  AKTIF: "sukses",
  SELESAI: "info",
  DIALIHKAN: "peringatan",
  DIBATALKAN: "netral",
};

interface RelasiBaris {
  id: string;
  status: string;
  ortuAsuh: { nama: string; atasNamaMunfiq: string | null };
  mahasiswa: { nama: string; nim: string };
  periodeMulai: { kode: string };
}

export function BarisRelasi({
  relasi,
  ortuAsuhList,
  periodeList,
}: {
  relasi: RelasiBaris;
  ortuAsuhList: { id: string; nama: string; atasNamaMunfiq: string | null }[];
  periodeList: { id: string; kode: string }[];
}) {
  const [aksiTerbuka, setAksiTerbuka] = useState<"alihkan" | "akhiri" | null>(null);

  return (
    <div className="rounded-xl border border-border bg-surface-alt/40 p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">
            {relasi.ortuAsuh.atasNamaMunfiq || relasi.ortuAsuh.nama}
            <span className="mx-1.5 text-muted">→</span>
            {relasi.mahasiswa.nama} <span className="text-muted">({relasi.mahasiswa.nim})</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">Mulai {relasi.periodeMulai.kode}</p>
        </div>
        <Lencana nada={NADA_STATUS[relasi.status] ?? "netral"}>
          {LABEL_STATUS[relasi.status] ?? relasi.status}
        </Lencana>
      </div>

      {relasi.status === "AKTIF" && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setAksiTerbuka(aksiTerbuka === "alihkan" ? null : "alihkan")}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Alihkan
            </button>
            <button
              type="button"
              onClick={() => setAksiTerbuka(aksiTerbuka === "akhiri" ? null : "akhiri")}
              className="text-xs font-semibold text-red-600 underline-offset-4 hover:underline"
            >
              Akhiri
            </button>
          </div>

          {aksiTerbuka === "alihkan" && (
            <FormAlihkan relasiId={relasi.id} ortuAsuhList={ortuAsuhList} periodeList={periodeList} />
          )}
          {aksiTerbuka === "akhiri" && <FormAkhiri relasiId={relasi.id} />}
        </div>
      )}
    </div>
  );
}

function FormAlihkan({
  relasiId,
  ortuAsuhList,
  periodeList,
}: {
  relasiId: string;
  ortuAsuhList: { id: string; nama: string; atasNamaMunfiq: string | null }[];
  periodeList: { id: string; kode: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      alihkanRelasi(relasiId, {
        ortuAsuhBaruId: formData.get("ortuAsuhBaruId"),
        periodeMulaiId: formData.get("periodeMulaiId"),
        alasan: formData.get("alasan"),
      }),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <select name="ortuAsuhBaruId" required className={KELAS_INPUT_KECIL}>
        {ortuAsuhList.map((o) => (
          <option key={o.id} value={o.id}>
            {o.atasNamaMunfiq || o.nama}
          </option>
        ))}
      </select>
      <select name="periodeMulaiId" required className={KELAS_INPUT_KECIL}>
        {periodeList.map((p) => (
          <option key={p.id} value={p.id}>
            {p.kode}
          </option>
        ))}
      </select>
      <textarea name="alasan" placeholder="Alasan alih pembina (wajib)" rows={2} className={KELAS_INPUT_KECIL} />
      <Tombol type="submit" disabled={pending} variant="garis" ukuran="sm" className="w-fit">
        {pending ? "Memproses..." : "Konfirmasi Alihkan"}
      </Tombol>
      {state.pesan && (
        <span className={`text-xs font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</span>
      )}
    </form>
  );
}

function FormAkhiri({ relasiId }: { relasiId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      akhiriRelasi(relasiId, { alasan: formData.get("alasan") }),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea name="alasan" placeholder="Alasan mengakhiri relasi (wajib)" rows={2} className={KELAS_INPUT_KECIL} />
      <Tombol type="submit" disabled={pending} variant="bahaya" ukuran="sm" className="w-fit">
        {pending ? "Memproses..." : "Konfirmasi Akhiri"}
      </Tombol>
      {state.pesan && (
        <span className={`text-xs font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</span>
      )}
    </form>
  );
}
