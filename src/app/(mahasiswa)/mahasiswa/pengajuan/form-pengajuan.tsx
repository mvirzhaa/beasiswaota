"use client";

import { useActionState, useRef } from "react";
import type { Pengajuan, PengajuanBerkas } from "@prisma/client";
import { formatRupiah } from "@/lib/uang";
import {
  JENIS_BERKAS_WAJIB,
  LABEL_JENIS_BERKAS,
} from "@/lib/pengajuan/schema";
import type { HasilAksi } from "@/types/aksi";
import { simpanPengajuan, unggahBerkasPengajuan } from "./actions";

type PengajuanDenganBerkas = Pengajuan & { berkas: PengajuanBerkas[] };

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

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
    <div className="flex flex-col gap-3 text-sm">
      <p>
        Status: <span className="font-semibold">{pengajuan.status}</span>
      </p>
      <p>Nominal kebutuhan: {formatRupiah(pengajuan.nominalKebutuhan)}</p>
      <p>Penghasilan orang tua: {formatRupiah(pengajuan.penghasilanOrtu)}</p>
      {pengajuan.status === "DITOLAK" && pengajuan.catatanVerifikator && (
        <p className="text-red-600">
          Catatan admin: {pengajuan.catatanVerifikator}
        </p>
      )}
      <div>
        <p className="font-medium">Berkas terunggah:</p>
        <ul className="list-inside list-disc">
          {pengajuan.berkas.map((b) => (
            <li key={b.id}>
              {LABEL_JENIS_BERKAS[b.jenis] ?? b.jenis} — {b.status}
            </li>
          ))}
        </ul>
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
    <form ref={formRef} className="flex flex-col gap-3">
      <input type="hidden" name="periodeId" value={periodeId} />

      <label className="flex flex-col gap-1">
        <span className="text-sm">Nominal kebutuhan (Rp)</span>
        <input
          name="nominalKebutuhan"
          required
          defaultValue={
            pengajuan ? pengajuan.nominalKebutuhan.toString() : ""
          }
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Penghasilan orang tua per bulan (Rp)</span>
        <input
          name="penghasilanOrtu"
          required
          defaultValue={pengajuan ? pengajuan.penghasilanOrtu.toString() : ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Jumlah tanggungan keluarga</span>
        <input
          name="jmlTanggungan"
          type="number"
          min={0}
          required
          defaultValue={pengajuan?.jmlTanggungan ?? ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Status orang tua</span>
        <select
          name="statusOrtu"
          defaultValue={pengajuan?.statusOrtu ?? "LENGKAP"}
          className="rounded-lg border border-border px-3 py-2"
        >
          <option value="LENGKAP">Lengkap</option>
          <option value="YATIM">Yatim</option>
          <option value="PIATU">Piatu</option>
          <option value="YATIM_PIATU">Yatim Piatu</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">Alasan pengajuan</span>
        <textarea
          name="alasan"
          required
          rows={4}
          defaultValue={pengajuan?.alasan ?? ""}
          className="rounded-lg border border-border px-3 py-2"
        />
      </label>

      {hasil.pesan && (
        <p
          className={`text-sm ${hasil.sukses ? "text-green-700" : "text-red-600"}`}
          role="alert"
        >
          {hasil.pesan}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          formAction={formActionDraft}
          disabled={pendingDraft || pendingSubmit}
          className="rounded-lg border border-border px-4 py-2 disabled:opacity-50"
        >
          {pendingDraft ? "Menyimpan..." : "Simpan draft"}
        </button>
        <button
          type="submit"
          formAction={formActionSubmit}
          disabled={pendingDraft || pendingSubmit}
          className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {pendingSubmit ? "Mengajukan..." : "Ajukan"}
        </button>
      </div>
    </form>
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
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-bold text-ink">Berkas pendukung</h2>
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
      className="flex flex-col gap-1 border-b pb-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <input type="hidden" name="pengajuanId" value={pengajuanId} />
      <input type="hidden" name="jenis" value={jenis} />

      <div className="text-sm">
        <p className="font-medium">{LABEL_JENIS_BERKAS[jenis] ?? jenis}</p>
        {existing ? (
          <p className="text-muted">
            {existing.namaAsli} — {existing.status}
          </p>
        ) : (
          <p className="text-muted">Belum diunggah</p>
        )}
        {state.pesan && (
          <p className={state.sukses ? "text-green-700" : "text-red-600"}>
            {state.pesan}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          accept="application/pdf,image/jpeg,image/png"
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-border px-3 py-1 text-sm disabled:opacity-50"
        >
          {pending ? "Mengunggah..." : existing ? "Ganti" : "Unggah"}
        </button>
      </div>
    </form>
  );
}
