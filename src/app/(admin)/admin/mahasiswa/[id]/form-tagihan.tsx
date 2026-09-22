"use client";

import { useActionState, useState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { InputNominal } from "@/components/forms/input-nominal";
import { buatTagihan, ubahTagihan } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

// Bentuk tagihan yang sudah diratakan ke string (bukan tipe Prisma Tagihan
// langsung — field BigInt-nya tidak bisa lewat batas Server->Client
// Component, lihat catatan yang sama di panel-tagihan.tsx).
export interface TagihanUntukForm {
  id: string;
  periodeId: string;
  komponen: string;
  nominal: string;
  jatuhTempoIso: string;
}

export function FormTagihan({
  mahasiswaId,
  periodeList,
  tagihan,
  onSelesai,
}: {
  mahasiswaId: string;
  periodeList: { id: string; kode: string }[];
  tagihan?: TagihanUntukForm;
  onSelesai?: () => void;
}) {
  const modeUbah = Boolean(tagihan);

  const [state, formAction, pending] = useActionState(async (_prev: HasilAksi, formData: FormData) => {
    const input = {
      periodeId: formData.get("periodeId"),
      komponen: formData.get("komponen"),
      nominal: formData.get("nominal"),
      jatuhTempo: formData.get("jatuhTempo"),
    };
    const hasil = modeUbah ? await ubahTagihan(tagihan!.id, input) : await buatTagihan(mahasiswaId, input);
    if (hasil.sukses) onSelesai?.();
    return hasil;
  }, STATE_AWAL);

  const [nominalTampilan] = useState(tagihan ? tagihan.nominal : "");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink">Periode</span>
        <select
          name="periodeId"
          required
          defaultValue={tagihan?.periodeId ?? periodeList[0]?.id ?? ""}
          className={KELAS_INPUT}
        >
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink">Komponen</span>
        <select name="komponen" required defaultValue={tagihan?.komponen ?? "UKT"} className={KELAS_INPUT}>
          <option value="UKT">UKT</option>
          <option value="SPP">SPP</option>
          <option value="LAINNYA">Lainnya</option>
        </select>
      </label>

      <InputNominal name="nominal" label="Nominal Tagihan" defaultValue={nominalTampilan} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink">Jatuh Tempo</span>
        <input
          type="date"
          name="jatuhTempo"
          required
          defaultValue={tagihan?.jatuhTempoIso.slice(0, 10) ?? ""}
          className={KELAS_INPUT}
        />
      </label>

      {state.pesan && (
        <p className={`sm:col-span-2 text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`} role="alert">
          {state.pesan}
        </p>
      )}

      <div className="sm:col-span-2">
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm">
          {pending ? "Menyimpan..." : modeUbah ? "Simpan Perubahan" : "Tambah Tagihan"}
        </Tombol>
      </div>
    </form>
  );
}
