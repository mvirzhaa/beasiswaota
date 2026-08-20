"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { setFlagNamaPenuh } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function FormFlagNamaPenuh({ aktifSaatIni }: { aktifSaatIni: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => setFlagNamaPenuh(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="aktif" defaultChecked={aktifSaatIni} />
        Tampilkan nama penuh mahasiswa
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded border px-3 py-1 text-sm disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
      {state.pesan && (
        <span className={`text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </span>
      )}
    </form>
  );
}
