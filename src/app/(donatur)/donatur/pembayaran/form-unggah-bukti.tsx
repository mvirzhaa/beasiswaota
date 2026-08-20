"use client";

import { useActionState } from "react";
import { formatRupiah } from "@/lib/uang";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
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
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Peruntukan Pembayaran (Opsional)</span>
        <select
          name="jadwalBayarId"
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Donasi Bebas / Lepas (Tanpa jadwal komitmen tertentu)</option>
          {jadwalTerbuka.map((j) => (
            <option key={j.id} value={j.id}>
              Tagihan Periode {j.periode.kode} #{j.urutan} — {formatRupiah(j.nominal)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink">Nominal Ditransfer (Rp) <span className="text-red-500">*</span></span>
          <input
            name="nominal"
            placeholder="Contoh: 5000000"
            required
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink">Tanggal Transfer / Bayar <span className="text-red-500">*</span></span>
          <input
            name="tglBayar"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Metode Pembayaran <span className="text-red-500">*</span></span>
        <select
          name="metode"
          defaultValue="TRANSFER_MANUAL"
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="TRANSFER_MANUAL">Transfer Manual Bank (BSI / Bank Lain)</option>
          <option value="VIRTUAL_ACCOUNT">Virtual Account</option>
          <option value="LAINNYA">Metode Lainnya</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Berkas Bukti Transfer (PDF / JPG / PNG, Maks. 5MB) <span className="text-red-500">*</span></span>
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface-alt/40 p-3.5 transition-all hover:border-primary/60">
          <UploadCloud className="h-6 w-6 shrink-0 text-primary" />
          <input
            type="file"
            name="bukti"
            accept="application/pdf,image/jpeg,image/png"
            required
            className="w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary hover:file:text-white file:transition-colors file:cursor-pointer"
          />
        </div>
      </label>

      {state.pesan && (
        <div
          className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
            state.sukses
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {state.sukses ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{state.pesan}</span>
        </div>
      )}

      <div className="pt-2">
        <Tombol
          type="submit"
          disabled={pending}
          variant="primer"
          className="w-full sm:w-auto"
        >
          {pending ? "Mengunggah Bukti..." : "Unggah Bukti Transfer"}
        </Tombol>
      </div>
    </form>
  );
}
