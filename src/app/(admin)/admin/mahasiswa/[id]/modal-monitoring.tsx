"use client";

import { useState, useActionState, useEffect } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { simpanMonitoringManual } from "../actions-monitoring";
import type { BarisMonitoringMahasiswa } from "@/server/queries/monitoring";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "w-full rounded-xl border border-border bg-surface-alt px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function ModalMonitoring({
  mahasiswaId,
  periodeId,
  periodeKode,
  data,
}: {
  mahasiswaId: string;
  periodeId: string;
  periodeKode: string;
  data: BarisMonitoringMahasiswa | null;
}) {
  const [buka, setBuka] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => simpanMonitoringManual(formData),
    STATE_AWAL,
  );

  useEffect(() => {
    if (state.sukses) {
      const timer = setTimeout(() => {
        setBuka(false);
        setFormKey((k) => k + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.sukses]);

  const handleTutup = () => {
    if (pending) return;
    setBuka(false);
  };

  return (
    <>
      <Tombol type="button" onClick={() => setBuka(true)} variant={data ? "garis" : "primer"} ukuran="sm" className="font-semibold text-xs">
        {data ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
        <span>{data ? "Edit Data" : "Tambah Data"}</span>
      </Tombol>

      <Modal
        buka={buka}
        onTutup={handleTutup}
        judul={`Monitoring Akademik — Periode ${periodeKode}`}
        deskripsi="Data terstruktur ini yang ditampilkan ke donatur pembina dan dipakai penilaian tingkat risiko."
        ukuran="md"
      >
        <form key={formKey} action={formAction} className="flex flex-col gap-3.5">
          <input type="hidden" name="mahasiswaId" value={mahasiswaId} />
          <input type="hidden" name="periodeId" value={periodeId} />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>IP Semester</span>
              <input
                type="number"
                name="ipSemester"
                step="0.01"
                min="0"
                max="4"
                defaultValue={data?.ipSemester ?? undefined}
                className={KELAS_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>IPK</span>
              <input
                type="number"
                name="ipk"
                step="0.01"
                min="0"
                max="4"
                defaultValue={data?.ipk ?? undefined}
                className={KELAS_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>SKS Semester</span>
              <input
                type="number"
                name="sksSemester"
                step="1"
                min="0"
                defaultValue={data?.sksSemester ?? undefined}
                className={KELAS_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>SKS Kumulatif</span>
              <input
                type="number"
                name="sksKumulatif"
                step="1"
                min="0"
                defaultValue={data?.sksKumulatif ?? undefined}
                className={KELAS_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>Status Akademik</span>
              <select name="statusAkademik" required defaultValue={data?.statusAkademik ?? "AKTIF"} className={KELAS_INPUT}>
                <option value="AKTIF">AKTIF</option>
                <option value="CUTI">CUTI</option>
                <option value="LULUS">LULUS</option>
                <option value="DO">DO</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>Persen Kehadiran</span>
              <input
                type="number"
                name="persenKehadiran"
                step="0.01"
                min="0"
                max="100"
                defaultValue={data?.persenKehadiran ?? undefined}
                className={KELAS_INPUT}
              />
            </label>
          </div>

          {state.pesan && (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                state.sukses
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {state.sukses ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{state.pesan}</span>
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border/80 pt-4">
            <Tombol type="button" variant="garis" ukuran="sm" onClick={handleTutup} disabled={pending}>
              Batal
            </Tombol>
            <Tombol type="submit" variant="primer" ukuran="sm" disabled={pending}>
              <Save className="h-3.5 w-3.5" />
              <span>{pending ? "Menyimpan..." : "Simpan"}</span>
            </Tombol>
          </div>
        </form>
      </Modal>
    </>
  );
}
