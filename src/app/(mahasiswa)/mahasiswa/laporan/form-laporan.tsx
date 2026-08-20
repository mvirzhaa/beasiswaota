"use client";

import { useActionState } from "react";
import type { LaporanPerkembangan } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { simpanLaporan, unggahLampiranLaporan, togglBolehDibacaPembina } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const LABEL_STATUS: Record<string, string> = {
  DRAFT: "Draft",
  DIKIRIM: "Dikirim, menunggu review",
  PERLU_REVISI: "Perlu revisi",
  DIVERIFIKASI: "Diverifikasi",
};

export function FormLaporan({
  periodeId,
  laporan,
}: {
  periodeId: string;
  laporan: LaporanPerkembangan | null;
}) {
  const bisaEdit = !laporan || laporan.status === "DRAFT" || laporan.status === "PERLU_REVISI";

  return (
    <div className="flex flex-col gap-6">
      {laporan && (
        <p className="text-sm">
          Status: <span className="font-medium">{LABEL_STATUS[laporan.status] ?? laporan.status}</span>
          {laporan.status === "PERLU_REVISI" && laporan.catatanReview && (
            <span className="block text-red-600">Catatan admin: {laporan.catatanReview}</span>
          )}
        </p>
      )}

      {bisaEdit ? (
        <FormIsi periodeId={periodeId} laporan={laporan} />
      ) : (
        <p className="whitespace-pre-wrap rounded border p-3 text-sm">{laporan?.isi}</p>
      )}

      {laporan && bisaEdit && <UnggahLampiran laporanId={laporan.id} lampiranAda={!!laporan.lampiranKey} />}
      {laporan && <TogglBacaPembina laporanId={laporan.id} boleh={laporan.bolehDibacaPembina} />}
    </div>
  );
}

function FormIsi({ periodeId, laporan }: { periodeId: string; laporan: LaporanPerkembangan | null }) {
  const [stateDraft, actionDraft, pendingDraft] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      simpanLaporan(periodeId, "draft", { isi: formData.get("isi") }),
    STATE_AWAL,
  );
  const [stateSubmit, actionSubmit, pendingSubmit] = useActionState(
    async (_prev: HasilAksi, formData: FormData) =>
      simpanLaporan(periodeId, "submit", { isi: formData.get("isi") }),
    STATE_AWAL,
  );

  const hasil = stateSubmit.pesan ? stateSubmit : stateDraft;

  return (
    <form className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span>Isi laporan perkembangan</span>
        <textarea
          name="isi"
          rows={6}
          required
          defaultValue={laporan?.isi ?? ""}
          className="rounded border px-3 py-2"
        />
      </label>

      {hasil.pesan && (
        <p className={`text-sm ${hasil.sukses ? "text-green-700" : "text-red-600"}`}>{hasil.pesan}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          formAction={actionDraft}
          disabled={pendingDraft || pendingSubmit}
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
        >
          {pendingDraft ? "Menyimpan..." : "Simpan draft"}
        </button>
        <button
          type="submit"
          formAction={actionSubmit}
          disabled={pendingDraft || pendingSubmit}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pendingSubmit ? "Mengirim..." : "Kirim laporan"}
        </button>
      </div>
    </form>
  );
}

function UnggahLampiran({ laporanId, lampiranAda }: { laporanId: string; lampiranAda: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => unggahLampiranLaporan(formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 text-sm">
      <input type="hidden" name="laporanId" value={laporanId} />
      <span>Lampiran scan KHS {lampiranAda ? "(sudah ada, unggah untuk mengganti)" : ""}</span>
      <div className="flex items-center gap-2">
        <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" className="text-sm" />
        <button type="submit" disabled={pending} className="rounded border px-3 py-1 text-sm disabled:opacity-50">
          {pending ? "Mengunggah..." : "Unggah"}
        </button>
      </div>
      {state.pesan && (
        <span className={state.sukses ? "text-green-700" : "text-red-600"}>{state.pesan}</span>
      )}
    </form>
  );
}

function TogglBacaPembina({ laporanId, boleh }: { laporanId: string; boleh: boolean }) {
  const [state, formAction, pending] = useActionState(
    async () => togglBolehDibacaPembina(laporanId, !boleh),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="flex items-center gap-2 text-sm">
      <span>Laporan ini {boleh ? "boleh" : "tidak boleh"} dibaca pembina.</span>
      <button type="submit" disabled={pending} className="rounded border px-3 py-1 text-xs disabled:opacity-50">
        {pending ? "Memproses..." : boleh ? "Sembunyikan dari pembina" : "Izinkan dibaca pembina"}
      </button>
      {state.pesan && (
        <span className={state.sukses ? "text-green-700" : "text-red-600"}>{state.pesan}</span>
      )}
    </form>
  );
}
