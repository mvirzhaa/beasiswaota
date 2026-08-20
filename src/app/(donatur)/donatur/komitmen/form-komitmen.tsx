"use client";

import { useActionState, useState } from "react";
import type { Periode } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { Info, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { buatKomitmen } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

export function FormKomitmen({ periodeList }: { periodeList: Periode[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => buatKomitmen(formData),
    STATE_AWAL,
  );
  const [skema, setSkema] = useState("FULL");
  const [jumlahPeriodeOpsi, setJumlahPeriodeOpsi] = useState("1");
  const [mekanisme, setMekanisme] = useState("TRANSFER_MANUAL");

  if (periodeList.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
        <p className="font-semibold">Belum Ada Periode Aktif</p>
        <p className="mt-1 text-xs">
          Saat ini belum ada periode semester yang dibuka untuk penerimaan komitmen baru.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      {/* Pilihan Periode Awal */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Periode Awal Mulai Donasi <span className="text-red-500">*</span></span>
        <select
          name="periodeAwalId"
          required
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {periodeList.map((p) => (
            <option key={p.id} value={p.id}>
              Semester {p.kode}
            </option>
          ))}
        </select>
      </label>

      {/* Skema Bantuan */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Skema Bantuan Beasiswa <span className="text-red-500">*</span></span>
        <select
          name="skema"
          value={skema}
          onChange={(e) => setSkema(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="FULL">Paket Penuh (Full — menanggung UKT penuh)</option>
          <option value="PARSIAL">Paket Parsial (Sebagian dari biaya UKT)</option>
          <option value="CUSTOM">Nominal Custom (Bebas tentukan rupiah)</option>
        </select>
      </label>

      {skema !== "FULL" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink">Nominal per Semester (Rp) <span className="text-red-500">*</span></span>
          <input
            name="nominalPerPeriode"
            placeholder="Contoh: 2500000"
            required
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      )}

      {/* Jangka Waktu */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Jangka Waktu Komitmen <span className="text-red-500">*</span></span>
        <select
          name="jumlahPeriodeOpsi"
          value={jumlahPeriodeOpsi}
          onChange={(e) => setJumlahPeriodeOpsi(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="1">1 Semester (Satu kali bantuan)</option>
          <option value="2">2 Semester (1 Tahun Akademik)</option>
          <option value="8">8 Semester (Sampai Lulus S1)</option>
          <option value="CUSTOM">Kustom (Tentukan jumlah semester)</option>
        </select>
      </label>

      {jumlahPeriodeOpsi === "CUSTOM" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink">Jumlah Semester <span className="text-red-500">*</span></span>
          <input
            name="jumlahPeriodeCustom"
            type="number"
            min={1}
            max={24}
            placeholder="Jumlah semester"
            required
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      )}

      {/* Mekanisme Pembayaran */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Mekanisme Pembayaran <span className="text-red-500">*</span></span>
        <select
          name="mekanisme"
          value={mekanisme}
          onChange={(e) => setMekanisme(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="TRANSFER_MANUAL">Transfer Manual ke Rekening UIKA</option>
          <option value="VIRTUAL_ACCOUNT">Virtual Account / Midtrans Snap</option>
          <option value="POTONG_GAJI">Potong Gaji (Khusus Dosen / Tendik UIKA)</option>
          <option value="LAINNYA">Lainnya</option>
        </select>
        {mekanisme === "POTONG_GAJI" && (
          <span className="mt-1 flex items-start gap-1.5 rounded-lg bg-primary-light/50 p-2.5 text-xs text-primary-dark">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Hanya tersedia untuk dosen/tenaga kependidikan UIKA dengan NIP terdaftar di profil akun Anda.
              Pemotongan dilakukan otomatis per bulan oleh bagian keuangan/payroll.
            </span>
          </span>
        )}
      </label>

      {/* Preferensi Penerima */}
      <fieldset className="rounded-xl border border-border/80 bg-surface-alt/30 p-4">
        <legend className="flex items-center gap-1.5 px-1 text-xs font-bold text-ink">
          <Sparkles className="h-3.5 w-3.5 text-accent-dark" />
          <span>Preferensi Mahasiswa Penerima (Opsional)</span>
        </legend>
        <p className="mt-0.5 text-xs text-muted">
          Catatan preferensi ini menjadi acuan pembobotan, namun dana tetap digabungkan ke dalam pool program.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="preferensiFakultas"
            placeholder="Contoh: Fakultas Agama Islam"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            name="preferensiProdi"
            placeholder="Contoh: Teknik Informatika"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            name="preferensiGender"
            placeholder="Gender (Laki-laki / Perempuan)"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            name="preferensiAsalDaerah"
            placeholder="Asal daerah (Kab/Kota)"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </fieldset>

      {/* Catatan */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Catatan Tambahan (Opsional)</span>
        <textarea
          name="catatan"
          rows={2}
          placeholder="Tuliskan catatan khusus atau pesan untuk pengelola program..."
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      {state.pesan && (
        <div
          className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
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

      <div className="pt-2">
        <Tombol
          type="submit"
          disabled={pending}
          variant="primer"
          className="w-full sm:w-auto"
        >
          {pending ? "Menyimpan Komitmen..." : "Simpan & Buat Komitmen"}
        </Tombol>
      </div>
    </form>
  );
}
