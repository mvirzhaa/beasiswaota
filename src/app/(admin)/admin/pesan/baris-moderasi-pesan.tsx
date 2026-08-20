"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { teruskanPesan, tolakPesan } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

interface PesanModerasi {
  id: string;
  isi: string;
  namaOrtuAsuh: string;
  namaMahasiswa: string;
  pengirimRole: string;
}

export function BarisModerasiPesan({ pesan }: { pesan: PesanModerasi }) {
  const [stateTeruskan, actionTeruskan, pendingTeruskan] = useActionState(
    async () => teruskanPesan(pesan.id),
    STATE_AWAL,
  );
  const [stateTolak, actionTolak, pendingTolak] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      tolakPesan(pesan.id, { alasan: formData.get("alasan") }),
    STATE_AWAL,
  );

  return (
    <div className="rounded border p-3 text-sm">
      <p className="text-muted">
        {pesan.namaOrtuAsuh} ↔ {pesan.namaMahasiswa} · dikirim oleh {pesan.pengirimRole}
      </p>
      <p className="mt-1">{pesan.isi}</p>

      <div className="mt-3 flex flex-col gap-2">
        <form action={actionTeruskan}>
          <button
            type="submit"
            disabled={pendingTeruskan}
            className="rounded-lg bg-primary px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            {pendingTeruskan ? "Memproses..." : "Teruskan"}
          </button>
          {stateTeruskan.pesan && !stateTeruskan.sukses && (
            <span className="ml-2 text-xs text-red-600">{stateTeruskan.pesan}</span>
          )}
        </form>

        <form action={actionTolak} className="flex flex-col gap-1">
          <textarea name="alasan" placeholder="Alasan penolakan (wajib)" rows={2} className="rounded-lg border border-border px-2 py-1 text-xs" />
          <button
            type="submit"
            disabled={pendingTolak}
            className="w-fit rounded-lg border border-red-600 px-3 py-1 text-xs text-red-600 disabled:opacity-50"
          >
            {pendingTolak ? "Memproses..." : "Tolak"}
          </button>
          {stateTolak.pesan && (
            <span className={`text-xs ${stateTolak.sukses ? "text-green-700" : "text-red-600"}`}>
              {stateTolak.pesan}
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
