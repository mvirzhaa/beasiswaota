"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import type { Periode } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { Modal } from "@/components/ui/modal";
import { InputNominal } from "@/components/forms/input-nominal";
import { Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { catatPengeluaranLain } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "w-full rounded-xl border border-border bg-surface-alt px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function ModalTambahPengeluaran({ periodeList }: { periodeList: Periode[] }) {
  const [buka, setBuka] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const res = await catatPengeluaranLain(formData);
      return res;
    },
    STATE_AWAL,
  );

  // Jika berhasil simpan, reset form dan tutup modal setelah jeda singkat
  useEffect(() => {
    if (state.sukses) {
      const timer = setTimeout(() => {
        setBuka(false);
        setFormKey((k) => k + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.sukses]);

  const handleBukaModal = () => {
    setBuka(true);
  };

  const handleTutupModal = () => {
    if (pending) return;
    setBuka(false);
  };

  return (
    <>
      <Tombol
        type="button"
        onClick={handleBukaModal}
        variant="primer"
        ukuran="sm"
        className="font-semibold text-xs"
      >
        <Plus className="h-4 w-4" />
        <span>Tambah Pengeluaran</span>
      </Tombol>

      <Modal
        buka={buka}
        onTutup={handleTutupModal}
        judul="Tambah Data Pengeluaran"
        deskripsi="Catat pengeluaran di luar sistem (mis. biaya transfer bank, operasional, atau refund). Dipotong langsung dari saldo pool periode terpilih."
        ukuran="md"
      >
        {periodeList.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-alt p-6 text-center">
            <p className="text-xs text-muted">Belum ada periode aktif untuk dicatat pengeluarannya.</p>
          </div>
        ) : (
          <form
            key={formKey}
            ref={formRef}
            action={formAction}
            className="flex flex-col gap-4"
          >
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

            <InputNominal
              name="nominal"
              label="Nominal Pengeluaran"
              hint="Dipotong langsung dari saldo pool kas periode"
            />

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink">
              <span>
                Keterangan <span className="text-red-500">*</span>
              </span>
              <textarea
                name="keterangan"
                required
                minLength={5}
                rows={3}
                placeholder="Mis. Biaya transfer bank, operasional program, atau refund ke donatur..."
                className={KELAS_INPUT}
              />
            </label>

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
              <Tombol
                type="button"
                variant="garis"
                ukuran="sm"
                onClick={handleTutupModal}
                disabled={pending}
              >
                Batal
              </Tombol>
              <Tombol
                type="submit"
                variant="primer"
                ukuran="sm"
                disabled={pending || state.sukses}
              >
                {pending ? "Menyimpan..." : state.sukses ? "Tersimpan" : "Simpan Pengeluaran"}
              </Tombol>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
