"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Info, User, Wallet, Sparkles } from "lucide-react";
import { Tombol } from "@/components/ui/tombol";
import { InputNominal } from "@/components/forms/input-nominal";
import type { KandidatEarmarkPublik } from "@/server/queries/donasi-publik";
import { daftarDonatur } from "./actions";
import type { HasilAksi } from "@/types/aksi";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export function FormPendaftaranDonatur({
  kandidatList,
}: {
  kandidatList: KandidatEarmarkPublik[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => daftarDonatur(formToObject(formData)),
    STATE_AWAL,
  );

  const [kategori, setKategori] = useState<"PERORANGAN" | "LEMBAGA">("PERORANGAN");
  const [internal, setInternal] = useState<"true" | "false">("true");
  const [checklistNama, setChecklistNama] = useState<"NONE" | "ATAS_NAMA" | "PAGUYUBAN">("NONE");
  const [tipeKomitmen, setTipeKomitmen] = useState<"SEKALI" | "BERULANG">("SEKALI");
  const [mekanisme, setMekanisme] = useState<"TRANSFER_MANUAL" | "POTONG_GAJI">("TRANSFER_MANUAL");
  const [skema, setSkema] = useState<"PARSIAL" | "FULL">("PARSIAL");
  const [targetPenyaluran, setTargetPenyaluran] = useState<"SEMUA_PENERIMA" | "SATU_MAHASISWA">(
    "SEMUA_PENERIMA",
  );

  const isLembaga = kategori === "LEMBAGA";
  const isInternal = !isLembaga && internal === "true";
  const perluAlamat = isLembaga || (!isLembaga && !isInternal);

  if (state.sukses) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center text-sm text-green-800">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="mt-3 font-bold text-base">Pendaftaran Berhasil!</p>
        <p className="mt-1 text-xs text-green-700 max-w-md mx-auto">{state.pesan}</p>
        <div className="mt-5">
          <Link href="/">
            <Tombol variant="primer" ukuran="sm">
              Kembali ke Beranda
            </Tombol>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* 2-Kolom Grid Responsif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* KOLOM KIRI: Identitas & Data Diri */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface-alt/30 p-4 sm:p-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-heading text-sm font-bold text-ink">
                1. {isLembaga ? "Identitas Lembaga" : "Identitas Donatur"}
              </h2>
              <p className="text-[11px] text-muted">Profil dan kontak resmi donatur</p>
            </div>
          </div>

          {/* Jenis Donatur */}
          <SegmentedControl
            name="kategori"
            label="Jenis Donatur"
            value={kategori}
            onChange={(v) => {
              setKategori(v);
              setMekanisme("TRANSFER_MANUAL");
              setChecklistNama("NONE");
            }}
            opsi={[
              { value: "PERORANGAN", label: "Perorangan" },
              { value: "LEMBAGA", label: "Lembaga / Instansi" },
            ]}
          />

          {/* Kategori Perorangan (Hanya Perorangan) */}
          {!isLembaga && (
            <SegmentedControl
              name="internal"
              label="Kategori Perorangan"
              value={internal}
              onChange={(v) => {
                setInternal(v);
                setMekanisme("TRANSFER_MANUAL");
              }}
              opsi={[
                { value: "true", label: "Internal UIKA (Dosen/Tendik)" },
                { value: "false", label: "Eksternal (Masyarakat Umum)" },
              ]}
            />
          )}

          {/* Nama Lengkap / Lembaga */}
          <Input
            name="nama"
            label={isLembaga ? "Nama Lembaga / Instansi" : "Nama Lengkap"}
            placeholder={isLembaga ? "Contoh: PT Berkah Sejahtera" : "Nama lengkap sesuai identitas"}
          />

          {/* Pilihan Label Nama (Perorangan) */}
          {!isLembaga && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-ink">Tampilkan Sebagai</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: "NONE", label: "Nama Pribadi" },
                  { value: "ATAS_NAMA", label: "Atas Nama" },
                  { value: "PAGUYUBAN", label: "Paguyuban" },
                ].map((o) => {
                  const isChecked = checklistNama === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-1.5 text-center text-xs transition-all ${
                        isChecked
                          ? "border-primary bg-primary-light/60 font-semibold text-primary"
                          : "border-border bg-surface text-ink hover:bg-surface-alt"
                      }`}
                    >
                      <input
                        type="radio"
                        name="__checklistNama"
                        value={o.value}
                        checked={isChecked}
                        onChange={() => setChecklistNama(o.value as typeof checklistNama)}
                        className="sr-only"
                      />
                      <span>{o.label}</span>
                    </label>
                  );
                })}
              </div>

              {checklistNama === "ATAS_NAMA" && (
                <div className="mt-1">
                  <input type="hidden" name="atasNama" value="true" />
                  <Input
                    name="namaAtasNama"
                    label="Atas Nama / Hamba Allah"
                    placeholder="Nama untuk laporan & sertifikat"
                  />
                </div>
              )}
              {checklistNama === "PAGUYUBAN" && (
                <div className="mt-1">
                  <input type="hidden" name="paguyuban" value="true" />
                  <Input
                    name="namaPaguyuban"
                    label="Nama Paguyuban"
                    placeholder="Contoh: Paguyuban Alumni Angkatan 2010"
                  />
                </div>
              )}
            </div>
          )}

          {/* WhatsApp & Email (Grid 2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input name="noHp" label="Nomor WhatsApp" placeholder="08xxxxxxxxxx" />
            <Input
              name="email"
              label="Alamat Email (Opsional)"
              type="email"
              required={false}
              placeholder="nama@email.com"
            />
          </div>

          {/* Alamat (Jika Wajib) */}
          {perluAlamat && (
            <Input
              name="alamat"
              label="Alamat Lengkap"
              placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
            />
          )}
        </div>

        {/* KOLOM KANAN: Nominal, Komitmen & Skema Penyaluran */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface-alt/30 p-4 sm:p-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-heading text-sm font-bold text-ink">
                2. Komitmen & Penyaluran Donasi
              </h2>
              <p className="text-[11px] text-muted">Nominal, skema, dan target penerima</p>
            </div>
          </div>

          {/* Nominal Donasi */}
          <InputNominal name="nominal" label="Nominal Donasi" hint="Minimal Rp50.000" />

          {/* Frekuensi & Metode Pembayaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SegmentedControl
              name="tipeKomitmen"
              label="Frekuensi Donasi"
              value={tipeKomitmen}
              onChange={(v) => setTipeKomitmen(v)}
              opsi={[
                { value: "SEKALI", label: "Satu Kali" },
                { value: "BERULANG", label: "Berkelanjutan" },
              ]}
            />

            <SegmentedControl
              name="mekanisme"
              label="Metode Pembayaran"
              value={mekanisme}
              onChange={(v) => setMekanisme(v)}
              opsi={
                isInternal
                  ? [
                      { value: "TRANSFER_MANUAL", label: "Transfer BSI" },
                      { value: "POTONG_GAJI", label: "Potong Gaji" },
                    ]
                  : [{ value: "TRANSFER_MANUAL", label: "Transfer BSI" }]
              }
            />
          </div>

          {/* Tanggal Pengingat jika Berkelanjutan */}
          {tipeKomitmen === "BERULANG" && (
            <label className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-3 text-xs">
              <span className="font-semibold text-ink">
                Tanggal Pengingat Bulanan <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                name="tanggalPengingat"
                min={1}
                max={31}
                placeholder="Contoh: 25 (setiap tgl 25)"
                required
                className={KELAS_INPUT}
              />
              <span className="flex items-start gap-1.5 text-[11px] text-muted">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                Pengingat pembayaran via WhatsApp dikirim setiap tanggal ini.
              </span>
            </label>
          )}

          {/* Skema Bantuan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">Pilihan Skema Bantuan</label>
            <div className="flex flex-col gap-2">
              {[
                {
                  value: "FULL" as const,
                  label: "Full Cover",
                  keterangan: "Menanggung 100% total biaya bagi satu mahasiswa yang paling membutuhkan.",
                },
                {
                  value: "PARSIAL" as const,
                  label: "Sharing",
                  keterangan: "Berbagi bersama donatur lain untuk menutup kebutuhan biaya mahasiswa.",
                },
              ].map((o) => {
                const isSelected = skema === o.value;
                return (
                  <label
                    key={o.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-xs transition-all ${
                      isSelected
                        ? "border-primary bg-primary-light/40 shadow-2xs"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-surface-alt/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="skema"
                      value={o.value}
                      checked={isSelected}
                      onChange={() => setSkema(o.value)}
                      className="mt-0.5 h-3.5 w-3.5 accent-primary shrink-0"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink leading-tight">{o.label}</span>
                      <span className="text-[11px] text-muted leading-tight mt-0.5">
                        {o.keterangan}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Target Penyaluran */}
          <div className="flex flex-col gap-1.5">
            <SegmentedControl
              name="targetPenyaluran"
              label="Target Penyaluran"
              value={targetPenyaluran}
              onChange={(v) => setTargetPenyaluran(v)}
              opsi={[
                { value: "SEMUA_PENERIMA", label: "Semua Penerima (Pool)" },
                { value: "SATU_MAHASISWA", label: "1 Mahasiswa Tertentu" },
              ]}
            />

            {targetPenyaluran === "SATU_MAHASISWA" && (
              <label className="flex flex-col gap-1.5 mt-2 rounded-xl border border-border bg-surface p-3 text-xs">
                <span className="font-semibold text-ink">
                  Pilih Mahasiswa Calon Penerima <span className="text-red-500">*</span>
                </span>
                <select name="targetMahasiswaId" required className={KELAS_INPUT}>
                  <option value="">-- Pilih Mahasiswa --</option>
                  {kandidatList.map((k) => (
                    <option key={k.mahasiswaId} value={k.mahasiswaId}>
                      {k.kodeAnonim} — {k.fakultas} / {k.prodi} (Angkatan {k.angkatan})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted">
                  Identitas mahasiswa disamarkan demi privasi. Informasi rinci tersedia di laporan setelah verifikasi.
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Pesan Error & Tombol Aksi */}
      {state.pesan && !state.sukses && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          role="alert"
        >
          {state.pesan}
        </div>
      )}

      <div className="pt-2">
        <Tombol
          type="submit"
          disabled={pending}
          variant="primer"
          ukuran="lg"
          className="w-full font-bold shadow-md hover:shadow-lg transition-all py-3 text-sm sm:text-base flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>{pending ? "Mendaftarkan..." : "Daftar Sebagai Orang Tua Asuh"}</span>
        </Tombol>
      </div>
    </form>
  );
}

function Input({
  name,
  label,
  type = "text",
  required = true,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={KELAS_INPUT}
      />
    </label>
  );
}

function SegmentedControl<T extends string>({
  name,
  label,
  value,
  onChange,
  opsi,
}: {
  name: string;
  label?: string;
  value: T;
  onChange: (v: T) => void;
  opsi: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold text-ink">{label}</span>}
      <div
        className="grid gap-1.5 rounded-xl border border-border bg-surface p-1"
        style={{
          gridTemplateColumns: `repeat(${opsi.length}, minmax(0, 1fr))`,
        }}
      >
        {opsi.map((o) => {
          const isSelected = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-1.5 text-center text-xs transition-all ${
                isSelected
                  ? "bg-primary font-semibold text-white shadow-xs"
                  : "text-ink/80 hover:text-ink hover:bg-surface-alt"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={isSelected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span className="truncate">{o.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

