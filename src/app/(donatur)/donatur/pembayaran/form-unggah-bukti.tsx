"use client";

import { useActionState } from "react";
import { formatRupiah } from "@/lib/uang";
import type { HasilAksi } from "@/types/aksi";
import { unggahBuktiTransfer } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

type JadwalTerbuka = {
  id: string;
  urutan: number;
  nominal: bigint;
  periode: { kode: string };
};

export function FormUnggahBukti({ jadwalTerbuka }: { jadwalTerbuka: JadwalTerbuka[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => unggahBuktiTransfer(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm">Untuk jadwal (opsional)</span>
        <select name="jadwalBayarId" className="rounded-lg border border-border px-3 py-2">
          <option value="">Donasi bebas (tanpa jadwal tertentu)</option>
          {jadwalTerbuka.map((j) => (
            <option key={j.id} value={j.id}>
              {j.periode.kode} #{j.urutan} — {formatRupiah(j.nominal)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Nominal ditransfer (Rp)</span>
        <input name="nominal" required className="rounded-lg border border-border px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Tanggal bayar</span>
        <input
          name="tglBayar"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Metode</span>
        <select name="metode" defaultValue="TRANSFER_MANUAL" className="rounded-lg border border-border px-3 py-2">
          <option value="TRANSFER_MANUAL">Transfer manual</option>
          <option value="VIRTUAL_ACCOUNT">Virtual account</option>
          <option value="LAINNYA">Lainnya</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Bukti transfer (PDF/JPG/PNG, maks 5MB)</span>
        <input
          type="file"
          name="bukti"
          accept="application/pdf,image/jpeg,image/png"
          required
          className="text-sm"
        />
      </label>

      {state.pesan && (
        <p className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Mengunggah..." : "Unggah bukti"}
      </button>
    </form>
  );
}
