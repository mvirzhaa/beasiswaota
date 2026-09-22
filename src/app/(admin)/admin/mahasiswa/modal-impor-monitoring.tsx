"use client";

import { useState, useActionState, useEffect } from "react";
import type { Periode } from "@prisma/client";
import { Tombol } from "@/components/ui/tombol";
import { Modal } from "@/components/ui/modal";
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { imporMonitoringXlsx, type HasilImporMonitoring } from "./actions-monitoring";
import { HEADER_KOLOM_MONITORING } from "@/lib/monitoring/xlsx-io";

const STATE_AWAL: HasilImporMonitoring = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "w-full rounded-xl border border-border bg-surface-alt px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function ModalImporMonitoring({ periodeList }: { periodeList: Periode[] }) {
  const [buka, setBuka] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilImporMonitoring, formData: FormData) => imporMonitoringXlsx(formData),
    STATE_AWAL,
  );

  useEffect(() => {
    if (state.sukses && (!state.errorBaris || state.errorBaris.length === 0)) {
      const timer = setTimeout(() => {
        setBuka(false);
        setFormKey((k) => k + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.sukses, state.errorBaris]);

  const handleTutup = () => {
    if (pending) return;
    setBuka(false);
  };

  return (
    <>
      <Tombol type="button" onClick={() => setBuka(true)} variant="garis" ukuran="sm" className="font-semibold text-xs">
        <FileSpreadsheet className="h-4 w-4" />
        <span>Impor Monitoring XLSX</span>
      </Tombol>

      <Modal
        buka={buka}
        onTutup={handleTutup}
        judul="Impor Massal Monitoring Akademik (XLSX SIAKAD)"
        deskripsi="Data IPK, IP semester, SKS, dan status akademik lintas mahasiswa untuk satu periode — dipakai kartu risiko & ditampilkan ke donatur pembina."
        ukuran="md"
      >
        {periodeList.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-alt p-6 text-center">
            <p className="text-xs text-muted">Belum ada periode yang dapat dipilih.</p>
          </div>
        ) : (
          <form key={formKey} action={formAction} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>
                Periode Semester <span className="text-red-500">*</span>
              </span>
              <select name="periodeId" required defaultValue="" className={KELAS_INPUT}>
                <option value="" disabled>
                  Pilih periode...
                </option>
                {periodeList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kode} (Status: {p.status})
                  </option>
                ))}
              </select>
            </label>

            <p className="text-xs text-muted">
              Sheet pertama, baris pertama header, urut kolom: <strong>{HEADER_KOLOM_MONITORING.join(", ")}</strong>.
              Status Akademik: AKTIF/CUTI/LULUS/DO. Baris dengan NIM yang sama akan menimpa data periode ini.
            </p>

            <input
              type="file"
              name="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              className="text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink hover:file:bg-primary-light"
            />

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

            {state.errorBaris && state.errorBaris.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">Baris gagal diimpor:</p>
                <ul className="mt-1.5 max-h-40 list-disc space-y-1 overflow-y-auto pl-4">
                  {state.errorBaris.map((e, i) => (
                    <li key={i}>
                      Baris {e.baris}: {e.pesan}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-border/80 pt-4">
              <Tombol type="button" variant="garis" ukuran="sm" onClick={handleTutup} disabled={pending}>
                Batal
              </Tombol>
              <Tombol type="submit" variant="primer" ukuran="sm" disabled={pending}>
                <Upload className="h-3.5 w-3.5" />
                <span>{pending ? "Memproses..." : "Impor Berkas"}</span>
              </Tombol>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
