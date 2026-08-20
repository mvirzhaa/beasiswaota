"use client";

import { useActionState, useState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { verifikasiAkun, tolakAkun } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

interface AkunMenunggu {
  id: string;
  email: string;
  role: string;
  nama: string;
  keterangan?: string;
}

export function BarisAkunMenunggu({ akun }: { akun: AkunMenunggu }) {
  const [tolakTerbuka, setTolakTerbuka] = useState(false);

  const [stateVerif, actionVerif, pendingVerif] = useActionState(
    async () => verifikasiAkun(akun.id),
    STATE_AWAL,
  );
  const [stateTolak, actionTolak, pendingTolak] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      tolakAkun(akun.id, { alasan: formData.get("alasan") }),
    STATE_AWAL,
  );

  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <p className="font-medium text-ink">
        {akun.nama} · {akun.role}
      </p>
      <p className="text-muted">
        {akun.email}
        {akun.keterangan ? ` · ${akun.keterangan}` : ""}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <form action={actionVerif}>
          <button
            type="submit"
            disabled={pendingVerif}
            className="rounded-lg bg-primary px-3 py-1 text-xs text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {pendingVerif ? "Memproses..." : "Aktifkan"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setTolakTerbuka((v) => !v)}
          className="text-xs text-red-600 underline"
        >
          Tolak
        </button>
        {stateVerif.pesan && !stateVerif.sukses && (
          <span className="text-xs text-red-600">{stateVerif.pesan}</span>
        )}
      </div>

      {tolakTerbuka && (
        <form action={actionTolak} className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
          <textarea
            name="alasan"
            placeholder="Alasan penolakan (wajib)"
            rows={2}
            className="rounded-lg border border-border px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={pendingTolak}
            className="w-fit rounded-lg border border-red-600 px-3 py-1 text-xs text-red-600 disabled:opacity-50"
          >
            {pendingTolak ? "Memproses..." : "Konfirmasi tolak"}
          </button>
          {stateTolak.pesan && (
            <span className={`text-xs ${stateTolak.sukses ? "text-green-700" : "text-red-600"}`}>
              {stateTolak.pesan}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
