"use client";

import { useActionState, useRef } from "react";
import type { Pengajuan, PengajuanBerkas } from "@prisma/client";
import { formatRupiah } from "@/lib/uang";
import {
  JENIS_BERKAS_WAJIB,
  LABEL_JENIS_BERKAS,
} from "@/lib/pengajuan/schema";
import type { HasilAksi } from "@/types/aksi";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  ShieldCheck,
  FileUp,
  Clock,
  Send,
  Save,
  Check,
} from "lucide-react";
import { simpanPengajuan, unggahBerkasPengajuan } from "./actions";

type PengajuanDenganBerkas = Pengajuan & { berkas: PengajuanBerkas[] };

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const LABEL_STATUS_PENGAJUAN: Record<string, string> = {
  DRAFT: "Draft (Belum Diajukan)",
  DIAJUKAN: "Telah Diajukan",
  VERIFIKASI_BERKAS: "Verifikasi Berkas",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS_PENGAJUAN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  DRAFT: "netral",
  DIAJUKAN: "info",
  VERIFIKASI_BERKAS: "peringatan",
  DISETUJUI: "sukses",
  DITOLAK: "bahaya",
  DIBATALKAN: "netral",
};

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export function FormPengajuan({
  periodeId,
  pengajuan,
}: {
  periodeId: string;
  pengajuan: PengajuanDenganBerkas | null;
}) {
  const bisaEdit = !pengajuan || pengajuan.status === "DRAFT";

  if (!bisaEdit) {
    return <RingkasanPengajuan pengajuan={pengajuan!} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <FormData_ periodeId={periodeId} pengajuan={pengajuan} />
      {pengajuan && (
        <UnggahBerkas pengajuanId={pengajuan.id} berkas={pengajuan.berkas} />
      )}
    </div>
  );
}

function RingkasanPengajuan({ pengajuan }: { pengajuan: PengajuanDenganBerkas }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Status Banner */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Status Pengajuan</h2>
            <p className="text-xs text-muted">Informasi status pemrosesan beasiswa Anda</p>
          </div>
          <Lencana nada={NADA_STATUS_PENGAJUAN[pengajuan.status] ?? "netral"}>
            {LABEL_STATUS_PENGAJUAN[pengajuan.status] ?? pengajuan.status}
          </Lencana>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl bg-surface-alt/60 p-3.5">
            <span className="text-muted">Nominal Kebutuhan:</span>
            <p className="mt-1 font-mono text-base font-bold text-primary">
              {formatRupiah(pengajuan.nominalKebutuhan)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-alt/60 p-3.5">
            <span className="text-muted">Penghasilan Orang Tua:</span>
            <p className="mt-1 font-mono text-base font-bold text-ink">
              {formatRupiah(pengajuan.penghasilanOrtu)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-alt/60 p-3.5">
            <span className="text-muted">Jumlah Tanggungan:</span>
            <p className="mt-1 font-heading text-base font-bold text-ink">
              {pengajuan.jmlTanggungan} Orang
            </p>
          </div>
        </div>

        {pengajuan.status === "DITOLAK" && pengajuan.catatanVerifikator && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <strong>Catatan Tim Verifikator:</strong>
              <p className="mt-0.5">{pengajuan.catatanVerifikator}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dokumen Terunggah */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h3 className="font-heading text-base font-bold text-ink border-b border-border pb-3">
          Dokumen Berkas Terunggah
        </h3>
        <div className="mt-4 divide-y divide-border/60">
          {pengajuan.berkas.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium text-ink">
                  {LABEL_JENIS_BERKAS[b.jenis] ?? b.jenis}
                </span>
                <span className="text-muted">({b.namaAsli})</span>
              </div>
              <Lencana nada={b.status === "VALID" ? "sukses" : b.status === "TIDAK_VALID" ? "bahaya" : "peringatan"}>
                {b.status}
              </Lencana>
            </div>
          ))}
          {pengajuan.berkas.length === 0 && (
            <p className="py-4 text-center text-xs text-muted">Belum ada berkas yang diunggah.</p>
          )}
        </div>
      </div>
    </div>
  );
}

async function actionDraft(_prev: HasilAksi, formData: FormData) {
  const periodeId = formData.get("periodeId") as string;
  return simpanPengajuan(periodeId, "draft", formToObject(formData));
}

async function actionSubmit(_prev: HasilAksi, formData: FormData) {
  const periodeId = formData.get("periodeId") as string;
  return simpanPengajuan(periodeId, "submit", formToObject(formData));
}

function FormData_({
  periodeId,
  pengajuan,
}: {
  periodeId: string;
  pengajuan: PengajuanDenganBerkas | null;
}) {
  const [stateDraft, formActionDraft, pendingDraft] = useActionState(
    actionDraft,
    STATE_AWAL,
  );
  const [stateSubmit, formActionSubmit, pendingSubmit] = useActionState(
    actionSubmit,
    STATE_AWAL,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const hasil = stateSubmit.pesan ? stateSubmit : stateDraft;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
      <h2 className="font-heading text-lg font-bold text-ink border-b border-border pb-3">
        Formulir Data Ekonomi & Pengajuan
      </h2>

      <form ref={formRef} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="periodeId" value={periodeId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Nominal Kebutuhan Bantuan UKT (Rp)</span>
            <input
              name="nominalKebutuhan"
              required
              placeholder="Contoh: 3500000"
              defaultValue={pengajuan ? pengajuan.nominalKebutuhan.toString() : ""}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Penghasilan Orang Tua per Bulan (Rp)</span>
            <input
              name="penghasilanOrtu"
              required
              placeholder="Contoh: 1500000"
              defaultValue={pengajuan ? pengajuan.penghasilanOrtu.toString() : ""}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Jumlah Tanggungan Keluarga (Jiwa)</span>
            <input
              name="jmlTanggungan"
              type="number"
              min={0}
              required
              placeholder="Jumlah anggota keluarga yang ditanggung"
              defaultValue={pengajuan?.jmlTanggungan ?? ""}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink">Status Orang Tua</span>
            <select
              name="statusOrtu"
              defaultValue={pengajuan?.statusOrtu ?? "LENGKAP"}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="LENGKAP">Kedua Orang Tua Lengkap</option>
              <option value="YATIM">Yatim (Ayah Wafat)</option>
              <option value="PIATU">Piatu (Ibu Wafat)</option>
              <option value="YATIM_PIATU">Yatim Piatu (Ayah & Ibu Wafat)</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink">Alasan & Kondisi Pengajuan</span>
          <textarea
            name="alasan"
            required
            rows={4}
            placeholder="Jelaskan kondisi ekonomi keluarga, kendala pembayaran UKT, dan motivasi belajar Anda..."
            defaultValue={pengajuan?.alasan ?? ""}
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

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Tombol
            type="submit"
            formAction={formActionDraft}
            disabled={pendingDraft || pendingSubmit}
            variant="garis"
          >
            <Save className="h-4 w-4" />
            <span>{pendingDraft ? "Menyimpan Draft..." : "Simpan Sebagai Draft"}</span>
          </Tombol>
          <Tombol
            type="submit"
            formAction={formActionSubmit}
            disabled={pendingDraft || pendingSubmit}
            variant="primer"
          >
            <Send className="h-4 w-4" />
            <span>{pendingSubmit ? "Mengajukan..." : "Kirimkan Pengajuan"}</span>
          </Tombol>
        </div>
      </form>
    </div>
  );
}

function UnggahBerkas({
  pengajuanId,
  berkas,
}: {
  pengajuanId: string;
  berkas: PengajuanBerkas[];
}) {
  const semuaJenis = [...JENIS_BERKAS_WAJIB, "LAINNYA"] as const;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-ink">Dokumen Pendukung</h2>
          <p className="text-xs text-muted">Unggah berkas dalam format PDF atau foto (JPG/PNG)</p>
        </div>
        <span className="text-xs font-semibold text-accent-dark">Wajib Diisi</span>
      </div>

      <div className="mt-4 divide-y divide-border/60">
        {semuaJenis.map((jenis) => {
          const existing = berkas.find((b) => b.jenis === jenis);
          return (
            <BarisUnggahBerkas
              key={jenis}
              pengajuanId={pengajuanId}
              jenis={jenis}
              existing={existing}
            />
          );
        })}
      </div>
    </div>
  );
}

function BarisUnggahBerkas({
  pengajuanId,
  jenis,
  existing,
}: {
  pengajuanId: string;
  jenis: string;
  existing?: PengajuanBerkas;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => unggahBerkasPengajuan(formData),
    STATE_AWAL,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <input type="hidden" name="pengajuanId" value={pengajuanId} />
      <input type="hidden" name="jenis" value={jenis} />

      <div className="text-xs">
        <p className="font-bold text-ink text-sm">{LABEL_JENIS_BERKAS[jenis] ?? jenis}</p>
        {existing ? (
          <p className="text-muted mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            <span>Terunggah: {existing.namaAsli}</span>
            <span className="font-semibold text-primary">({existing.status})</span>
          </p>
        ) : (
          <p className="text-muted/80 mt-0.5">Belum diunggah</p>
        )}
        {state.pesan && (
          <p className={`mt-1 font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>
            {state.pesan}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          name="file"
          accept="application/pdf,image/jpeg,image/png"
          required
          className="text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-primary-light"
        />
        <Tombol
          type="submit"
          disabled={pending}
          variant="primer"
          ukuran="sm"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{pending ? "Mengunggah..." : existing ? "Ganti Berkas" : "Unggah"}</span>
        </Tombol>
      </div>
    </form>
  );
}
