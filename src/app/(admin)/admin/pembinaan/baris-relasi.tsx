"use client";

import { useActionState, useState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { alihkanRelasi, akhiriRelasi } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const LABEL_STATUS: Record<string, string> = {
  AKTIF: "Aktif",
  SELESAI: "Selesai",
  DIALIHKAN: "Dialihkan",
  DIBATALKAN: "Dibatalkan",
};

interface RelasiBaris {
  id: string;
  status: string;
  persetujuanMahasiswa: boolean;
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
    <div className="rounded border p-3 text-sm">
      <p className="font-medium">
        {relasi.ortuAsuh.atasNamaMunfiq || relasi.ortuAsuh.nama} → {relasi.mahasiswa.nama} (
        {relasi.mahasiswa.nim})
      </p>
      <p className="text-gray-600">
        Mulai {relasi.periodeMulai.kode} · {LABEL_STATUS[relasi.status] ?? relasi.status} ·{" "}
        Persetujuan mahasiswa: {relasi.persetujuanMahasiswa ? "Ya" : "Belum"}
      </p>

      {relasi.status === "AKTIF" && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAksiTerbuka(aksiTerbuka === "alihkan" ? null : "alihkan")}
              className="text-xs underline"
            >
              Alihkan
            </button>
            <button
              type="button"
              onClick={() => setAksiTerbuka(aksiTerbuka === "akhiri" ? null : "akhiri")}
              className="text-xs underline"
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
    <form action={formAction} className="flex flex-col gap-2 border-t pt-2">
      <select name="ortuAsuhBaruId" required className="rounded border px-2 py-1 text-xs">
        {ortuAsuhList.map((o) => (
          <option key={o.id} value={o.id}>
            {o.atasNamaMunfiq || o.nama}
          </option>
        ))}
      </select>
      <select name="periodeMulaiId" required className="rounded border px-2 py-1 text-xs">
        {periodeList.map((p) => (
          <option key={p.id} value={p.id}>
            {p.kode}
          </option>
        ))}
      </select>
      <textarea name="alasan" placeholder="Alasan alih pembina (wajib)" rows={2} className="rounded border px-2 py-1 text-xs" />
      <button type="submit" disabled={pending} className="w-fit rounded border px-3 py-1 text-xs disabled:opacity-50">
        {pending ? "Memproses..." : "Konfirmasi alihkan"}
      </button>
      {state.pesan && (
        <span className={`text-xs ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</span>
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
    <form action={formAction} className="flex flex-col gap-2 border-t pt-2">
      <textarea name="alasan" placeholder="Alasan mengakhiri relasi (wajib)" rows={2} className="rounded border px-2 py-1 text-xs" />
      <button type="submit" disabled={pending} className="w-fit rounded border border-red-600 px-3 py-1 text-xs text-red-600 disabled:opacity-50">
        {pending ? "Memproses..." : "Konfirmasi akhiri"}
      </button>
      {state.pesan && (
        <span className={`text-xs ${state.sukses ? "text-green-700" : "text-red-600"}`}>{state.pesan}</span>
      )}
    </form>
  );
}
