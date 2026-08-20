"use client";

import { useActionState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import { Check, X, Send, AlertCircle, ArrowRight, MessageSquare } from "lucide-react";
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

  const isFromMahasiswa = pesan.pengirimRole === "MAHASISWA";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs transition-all hover:border-primary/40">
      {/* Sender - Receiver Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-ink">{pesan.namaOrtuAsuh}</span>
          <span className="text-muted">↔</span>
          <span className="font-semibold text-ink">{pesan.namaMahasiswa}</span>
        </div>
        <Lencana nada={isFromMahasiswa ? "info" : "sukses"}>
          Dikirim oleh: {pesan.pengirimRole}
        </Lencana>
      </div>

      {/* Message Content */}
      <div className="mt-4 rounded-xl bg-surface-alt/60 p-4">
        <p className="whitespace-pre-wrap text-sm text-ink leading-relaxed font-sans">
          {pesan.isi}
        </p>
      </div>

      {/* Moderation Actions */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-t border-border/60 pt-4">
        {/* Approve / Forward Action */}
        <form action={actionTeruskan} className="flex items-center gap-2">
          <Tombol
            type="submit"
            disabled={pendingTeruskan}
            variant="primer"
            ukuran="sm"
          >
            <Check className="h-4 w-4" />
            <span>{pendingTeruskan ? "Meneruskan..." : "Loloskan & Teruskan Pesan"}</span>
          </Tombol>
          {stateTeruskan.pesan && !stateTeruskan.sukses && (
            <span className="text-xs text-red-600 font-medium">{stateTeruskan.pesan}</span>
          )}
        </form>

        {/* Reject Action with Reason */}
        <form action={actionTolak} className="flex flex-col gap-2 sm:max-w-md w-full">
          <div className="flex gap-2">
            <input
              name="alasan"
              placeholder="Alasan penolakan (misal: terdapat nomor HP/kontak pribadi)..."
              required
              className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-ink transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            <Tombol
              type="submit"
              disabled={pendingTolak}
              variant="bahaya"
              ukuran="sm"
              className="shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>{pendingTolak ? "Menolak..." : "Tolak Pesan"}</span>
            </Tombol>
          </div>
          {stateTolak.pesan && (
            <span
              className={`text-xs font-medium ${
                stateTolak.sukses ? "text-green-700" : "text-red-600"
              }`}
            >
              {stateTolak.pesan}
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
