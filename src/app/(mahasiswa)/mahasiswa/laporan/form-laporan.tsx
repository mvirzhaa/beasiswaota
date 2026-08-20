"use client";

import { useActionState } from "react";
import type { LaporanPerkembangan } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import {
  Save,
  Send,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
} from "lucide-react";
import { simpanLaporan, unggahLampiranLaporan, togglBolehDibacaPembina } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const LABEL_STATUS: Record<string, string> = {
  DRAFT: "Draft (Belum Dikirim)",
  DIKIRIM: "Dikirim (Menunggu Review)",
  PERLU_REVISI: "Perlu Revisi",
  DIVERIFIKASI: "Diverifikasi",
};

const NADA_STATUS: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  DRAFT: "netral",
  DIKIRIM: "info",
  PERLU_REVISI: "peringatan",
  DIVERIFIKASI: "sukses",
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
      {/* Kartu Status Laporan */}
      {laporan && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-muted">Status Laporan Periode Ini:</span>
              <p className="font-heading text-base font-bold text-ink">
                {LABEL_STATUS[laporan.status] ?? laporan.status}
              </p>
            </div>
            <Lencana nada={NADA_STATUS[laporan.status] ?? "netral"}>
              {LABEL_STATUS[laporan.status] ?? laporan.status}
            </Lencana>
          </div>

          {laporan.status === "PERLU_REVISI" && laporan.catatanReview && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <strong>Catatan Reviewer / Admin:</strong>
                <p className="mt-0.5">{laporan.catatanReview}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Isi Laporan */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 className="font-heading text-lg font-bold text-ink border-b border-border pb-3">
          Rincian Perkembangan Studi
        </h2>

        {bisaEdit ? (
          <div className="mt-6">
            <FormIsi periodeId={periodeId} laporan={laporan} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-surface-alt/60 p-4">
            <p className="text-xs font-semibold text-muted">Isi Laporan Terkirim:</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink leading-relaxed">{laporan?.isi}</p>
          </div>
        )}
      </div>

      {/* Unggah Lampiran KHS */}
      {laporan && bisaEdit && (
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
          <h2 className="font-heading text-lg font-bold text-ink border-b border-border pb-3">
            Lampiran Scan KHS / Transkrip
          </h2>
          <div className="mt-4">
            <UnggahLampiran laporanId={laporan.id} lampiranAda={!!laporan.lampiranKey} />
          </div>
        </div>
      )}

      {/* Privasi Pembacaan Pembina */}
      {laporan && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <TogglBacaPembina laporanId={laporan.id} boleh={laporan.bolehDibacaPembina} />
        </div>
      )}
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
    <form className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">
          Tuliskan Capaian IPK, Mata Kuliah yang Diambil, dan Kegiatan Organisasi / Prestasi:
        </span>
        <textarea
          name="isi"
          rows={7}
          required
          placeholder="Contoh: Pada semester ini saya memperoleh IPK 3.82 dengan total 21 SKS. Selain itu aktif dalam kepengurusan BEM dan memenangkan juara 2 lomba karya tulis ilmiah..."
          defaultValue={laporan?.isi ?? ""}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      {hasil.pesan && (
        <div
          className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
            hasil.sukses
              ? "border border-green-200 bg-green-50 text-green-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {hasil.sukses ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{hasil.pesan}</span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <Tombol
          type="submit"
          formAction={actionDraft}
          disabled={pendingDraft || pendingSubmit}
          variant="garis"
        >
          <Save className="h-4 w-4" />
          <span>{pendingDraft ? "Menyimpan..." : "Simpan Sebagai Draft"}</span>
        </Tombol>
        <Tombol
          type="submit"
          formAction={actionSubmit}
          disabled={pendingDraft || pendingSubmit}
          variant="primer"
        >
          <Send className="h-4 w-4" />
          <span>{pendingSubmit ? "Mengirim..." : "Kirimkan Laporan"}</span>
        </Tombol>
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
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="laporanId" value={laporanId} />
      <p className="text-xs text-muted">
        Unggah scan berkas Kartu Hasil Studi (KHS) resmi dalam format PDF atau gambar (JPG/PNG).
        {lampiranAda && (
          <span className="ml-1 font-semibold text-primary">
            (Lampiran KHS saat ini sudah terunggah)
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept="application/pdf,image/jpeg,image/png"
          className="text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-primary-light"
        />
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm">
          <Upload className="h-3.5 w-3.5" />
          <span>{pending ? "Mengunggah..." : lampiranAda ? "Ganti Lampiran KHS" : "Unggah KHS"}</span>
        </Tombol>
      </div>
      {state.pesan && (
        <p className={`text-xs font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </p>
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
    <form action={formAction} className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-ink">
        {boleh ? (
          <Eye className="h-4 w-4 text-primary" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted" />
        )}
        <span>
          Visibilitas Pembina:{" "}
          <strong className={boleh ? "text-primary" : "text-muted"}>
            {boleh ? "Dapat dibaca oleh Orang Tua Asuh" : "Disembunyikan dari Orang Tua Asuh"}
          </strong>
        </span>
      </div>
      <Tombol type="submit" disabled={pending} variant="garis" ukuran="sm">
        {pending
          ? "Memproses..."
          : boleh
          ? "Sembunyikan dari Pembina"
          : "Izinkan Dibaca Pembina"}
      </Tombol>
      {state.pesan && (
        <p className={`w-full text-xs font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>
          {state.pesan}
        </p>
      )}
    </form>
  );
}
