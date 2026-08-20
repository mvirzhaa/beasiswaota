"use client";

import { useActionState, useState } from "react";
import type { Periode } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { buatKomitmen } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function FormKomitmen({ periodeList }: { periodeList: Periode[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => buatKomitmen(formData),
    STATE_AWAL,
  );
  const [skema, setSkema] = useState("FULL");
  const [jumlahPeriodeOpsi, setJumlahPeriodeOpsi] = useState("1");
  const [mekanisme, setMekanisme] = useState("TRANSFER_MANUAL");

  if (periodeList.length === 0) {
    return (
      <p className="mt-3 text-sm text-gray-500">
        Belum ada periode yang bisa dipilih untuk komitmen baru.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm">Periode awal</span>
        <select name="periodeAwalId" required className="rounded border px-3 py-2">
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kode}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Skema bantuan</span>
        <select
          name="skema"
          value={skema}
          onChange={(e) => setSkema(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="FULL">Full (sesuai paket penuh periode)</option>
          <option value="PARSIAL">Parsial (sebagian dari paket penuh)</option>
          <option value="CUSTOM">Custom (nominal bebas)</option>
        </select>
      </label>

      {skema !== "FULL" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm">Nominal per periode (Rp)</span>
          <input
            name="nominalPerPeriode"
            required
            className="rounded border px-3 py-2"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm">Jangka waktu</span>
        <select
          name="jumlahPeriodeOpsi"
          value={jumlahPeriodeOpsi}
          onChange={(e) => setJumlahPeriodeOpsi(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="1">1 semester (sekali)</option>
          <option value="2">2 semester</option>
          <option value="8">8 semester</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </label>

      {jumlahPeriodeOpsi === "CUSTOM" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm">Jumlah semester (custom)</span>
          <input
            name="jumlahPeriodeCustom"
            type="number"
            min={1}
            max={24}
            required
            className="rounded border px-3 py-2"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm">Mekanisme pembayaran</span>
        <select
          name="mekanisme"
          value={mekanisme}
          onChange={(e) => setMekanisme(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="TRANSFER_MANUAL">Transfer manual</option>
          <option value="VIRTUAL_ACCOUNT">Virtual account</option>
          <option value="POTONG_GAJI">Potong gaji</option>
          <option value="LAINNYA">Lainnya</option>
        </select>
        {mekanisme === "POTONG_GAJI" && (
          <span className="text-xs text-gray-500">
            Hanya tersedia untuk dosen/tenaga kependidikan UIKA dengan NIP terdaftar di
            profil Anda. Ritme otomatis bulanan.
          </span>
        )}
      </label>

      <fieldset className="rounded border p-3">
        <legend className="px-1 text-sm font-medium">
          Preferensi penerima (opsional, tidak mengunci dana)
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="preferensiFakultas"
            placeholder="Fakultas"
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="preferensiProdi"
            placeholder="Program studi"
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="preferensiGender"
            placeholder="Gender"
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="preferensiAsalDaerah"
            placeholder="Asal daerah"
            className="rounded border px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Catatan (opsional)</span>
        <textarea name="catatan" rows={2} className="rounded border px-3 py-2" />
      </label>

      {state.pesan && (
        <p className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Buat komitmen"}
      </button>
    </form>
  );
}
