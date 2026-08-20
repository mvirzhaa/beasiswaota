"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { GraduationCap, HeartHandshake } from "lucide-react";
import {
  registerMahasiswa,
  registerOrtuAsuh,
  type HasilRegistrasi,
} from "./actions";
import { FooterProgram } from "@/components/ui/footer-program";
import { Tombol } from "@/components/ui/tombol";

const STATE_AWAL: HasilRegistrasi = { sukses: false, pesan: "" };

function formToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

async function actionMahasiswa(_prev: HasilRegistrasi, formData: FormData) {
  return registerMahasiswa(formToObject(formData));
}

async function actionOrtuAsuh(_prev: HasilRegistrasi, formData: FormData) {
  return registerOrtuAsuh(formToObject(formData));
}

export default function HalamanRegister() {
  return (
    <Suspense fallback={null}>
      <KontenRegister />
    </Suspense>
  );
}

function KontenRegister() {
  const searchParams = useSearchParams();
  const defaultPeran = searchParams.get("peran") === "ORTU_ASUH" || searchParams.get("role") === "ORTU_ASUH"
    ? "ORTU_ASUH"
    : "MAHASISWA";
  const [peran, setPeran] = useState<"MAHASISWA" | "ORTU_ASUH">(defaultPeran);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-primary-light via-surface-alt to-accent/10">
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-uika.png"
              alt="Logo UIKA"
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-xs"
              priority
            />
            <div>
              <span className="block font-heading text-lg font-bold leading-none text-primary">
                UIKA Bogor
              </span>
              <span className="text-xs font-medium text-muted">Program Beasiswa Orangtua Asuh</span>
            </div>
          </div>

          <div className="mt-6">
            <h1 className="font-heading text-2xl font-bold text-ink">
              Pendaftaran Akun Baru
            </h1>
            <p className="mt-1 text-xs text-muted">
              Pilih jenis akun sesuai dengan peran Anda di lingkungan Universitas Ibn Khaldun Bogor.
            </p>
          </div>

          {/* Tab Pemilih Peran */}
          <div className="mt-6 flex rounded-xl bg-surface-alt p-1 border border-border">
            <button
              type="button"
              onClick={() => setPeran("MAHASISWA")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                peran === "MAHASISWA"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Mahasiswa Pemohon</span>
            </button>
            <button
              type="button"
              onClick={() => setPeran("ORTU_ASUH")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                peran === "ORTU_ASUH"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Orang Tua Asuh (Donatur)</span>
            </button>
          </div>

          <div className="mt-6">{peran === "MAHASISWA" ? <FormMahasiswa /> : <FormOrtuAsuh />}</div>

          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 text-center text-xs text-ink">
            <div>
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-bold text-primary underline hover:text-primary-dark">
                Masuk ke Akun
              </Link>
            </div>
            <div className="mt-1">
              <Link href="/" className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink transition-colors">
                <span>&larr; Kembali ke Halaman Utama</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <FooterProgram />
    </main>
  );
}

function FormMahasiswa() {
  const [state, formAction, pending] = useActionState(
    actionMahasiswa,
    STATE_AWAL,
  );

  if (state.sukses) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center text-sm text-green-800">
        <p className="font-bold">Pendaftaran Berhasil!</p>
        <p className="mt-1 text-xs">{state.pesan}</p>
        <div className="mt-4">
          <Link href="/login">
            <Tombol variant="primer" ukuran="sm">
              Menuju Halaman Masuk
            </Tombol>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="email" label="Email UIKA / Aktif" type="email" placeholder="nama@uika-bogor.ac.id" />
        <Input name="password" label="Kata Sandi" type="password" placeholder="••••••••" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="nim" label="Nomor Induk Mahasiswa (NIM)" placeholder="Contoh: 2111050..." />
        <Input name="nama" label="Nama Lengkap" placeholder="Sesuai KTP / KTM" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="fakultas" label="Fakultas" placeholder="Contoh: Teknik & Sains" />
        <Input name="prodi" label="Program Studi" placeholder="Contoh: Teknik Informatika" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="angkatan" label="Tahun Angkatan" type="number" placeholder="2024" />
        <Input name="semesterBerjalan" label="Semester Berjalan" type="number" placeholder="1 s.d. 8" />
      </div>

      <Input name="noHp" label="Nomor WhatsApp / HP Aktif" placeholder="08xxxxxxxxxx" />
      <Input name="alamat" label="Alamat Domisili (Opsional)" required={false} placeholder="Alamat tinggal di Bogor / asal" />

      {state.pesan && !state.sukses && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {state.pesan}
        </div>
      )}

      <Tombol
        type="submit"
        disabled={pending}
        variant="primer"
        ukuran="lg"
        className="mt-2 w-full font-bold shadow-md"
      >
        <span>{pending ? "Mendaftarkan Akun..." : "Daftar Sebagai Mahasiswa"}</span>
      </Tombol>
    </form>
  );
}

function FormOrtuAsuh() {
  const [state, formAction, pending] = useActionState(
    actionOrtuAsuh,
    STATE_AWAL,
  );

  if (state.sukses) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center text-sm text-green-800">
        <p className="font-bold">Pendaftaran Donatur Berhasil!</p>
        <p className="mt-1 text-xs">{state.pesan}</p>
        <div className="mt-4">
          <Link href="/login">
            <Tombol variant="primer" ukuran="sm">
              Menuju Halaman Masuk
            </Tombol>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="email" label="Alamat Email" type="email" placeholder="nama@email.com" />
        <Input name="password" label="Kata Sandi" type="password" placeholder="••••••••" />
      </div>

      <Input name="nama" label="Nama Lengkap Donatur" placeholder="Nama lengkap atau gelar" />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink">Kategori Donatur</span>
        <select
          name="tipe"
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="INDIVIDU">Individu / Masyarakat Umum</option>
          <option value="DOSEN">Dosen UIKA Bogor</option>
          <option value="TENAGA_KEPENDIDIKAN">Tenaga Kependidikan UIKA</option>
          <option value="ALUMNI">Alumni UIKA</option>
          <option value="INSTANSI">Instansi / Lembaga / Korporasi</option>
        </select>
      </label>

      <Input name="instansi" label="Nama Lembaga / Instansi (Opsional)" required={false} placeholder="Jika mewakili instansi" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input name="noHp" label="Nomor WhatsApp" placeholder="08xxxxxxxxxx" />
        <Input name="noHpAlternatif" label="Nomor HP Alternatif" placeholder="08xxxxxxxxxx" />
      </div>

      <Input name="alamat" label="Alamat / Kota (Opsional)" required={false} placeholder="Kota domisili" />
      <Input
        name="atasNamaMunfiq"
        label="Atas Nama Munfiq / Hamba Allah (Opsional)"
        required={false}
        placeholder="Nama untuk laporan/sertifikat (kosongkan jika nama pribadi)"
      />

      {state.pesan && !state.sukses && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {state.pesan}
        </div>
      )}

      <Tombol
        type="submit"
        disabled={pending}
        variant="primer"
        ukuran="lg"
        className="mt-2 w-full font-bold shadow-md"
      >
        <span>{pending ? "Mendaftarkan Akun..." : "Daftar Sebagai Orang Tua Asuh"}</span>
      </Tombol>
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
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
