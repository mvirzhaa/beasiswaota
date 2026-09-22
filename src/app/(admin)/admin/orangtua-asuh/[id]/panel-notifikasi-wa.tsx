"use client";

import { useActionState, useState } from "react";
import type { Notifikasi } from "@prisma/client";
import { Send, MessageCircleMore } from "lucide-react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { kirimPesanWaManual, kirimLaporanWa } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function PanelNotifikasiWa({
  ortuAsuhId,
  riwayat,
}: {
  ortuAsuhId: string;
  riwayat: Notifikasi[];
}) {
  const [stateLaporan, kirimLaporanAction, pendingLaporan] = useActionState(
    async () => kirimLaporanWa(ortuAsuhId),
    STATE_AWAL,
  );

  const [pesan, setPesan] = useState("");
  const [statePesan, kirimPesanAction, pendingPesan] = useActionState(async () => {
    const hasil = await kirimPesanWaManual(ortuAsuhId, pesan);
    if (hasil.sukses) setPesan("");
    return hasil;
  }, STATE_AWAL);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <MessageCircleMore className="h-4 w-4 text-primary" />
        <h3 className="font-heading text-base font-bold text-ink">Notifikasi WhatsApp</h3>
      </div>

      <form action={kirimLaporanAction} className="flex flex-col gap-2">
        <Tombol type="submit" disabled={pendingLaporan} variant="garis" ukuran="sm" className="w-fit">
          <Send className="h-3.5 w-3.5" />
          <span>{pendingLaporan ? "Mengirim..." : "Kirim Laporan via WA"}</span>
        </Tombol>
        {stateLaporan.pesan && (
          <p className={`text-xs ${stateLaporan.sukses ? "text-green-700" : "text-red-600"}`} role="alert">
            {stateLaporan.pesan}
          </p>
        )}
      </form>

      <form action={kirimPesanAction} className="flex flex-col gap-2 border-t border-border pt-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink">Pesan WA Bebas</span>
          <textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={3}
            placeholder="Tulis pesan untuk donatur ini..."
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <Tombol type="submit" disabled={pendingPesan || !pesan.trim()} variant="primer" ukuran="sm" className="w-fit">
          {pendingPesan ? "Mengirim..." : "Kirim Pesan WA"}
        </Tombol>
        {statePesan.pesan && (
          <p className={`text-xs ${statePesan.sukses ? "text-green-700" : "text-red-600"}`} role="alert">
            {statePesan.pesan}
          </p>
        )}
      </form>

      {riwayat.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold text-ink">Riwayat Terkirim</p>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {riwayat.map((n) => (
              <div key={n.id} className="rounded-lg bg-surface-alt/50 px-2.5 py-2 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{n.judul}</span>
                  <span className="text-muted">{n.createdAt.toLocaleString("id-ID")}</span>
                </div>
                <p className="mt-0.5 text-muted">{n.terkirimAt ? "Terkirim" : "Gagal terkirim"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
