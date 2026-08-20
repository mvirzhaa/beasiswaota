"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import {
  registerMahasiswa,
  registerOrtuAsuh,
  type HasilRegistrasi,
} from "./actions";
import { FooterProgram } from "@/components/ui/footer-program";

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
  const [peran, setPeran] = useState<"MAHASISWA" | "ORTU_ASUH">("MAHASISWA");

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-primary-light via-surface-alt to-accent/10">
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
            <GraduationCap className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-xs font-medium tracking-wide text-accent-dark uppercase">
            Beasiswa Orangtua Asuh
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-ink">Daftar</h1>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setPeran("MAHASISWA")}
              className={`rounded-lg px-3 py-1 text-sm transition-colors ${peran === "MAHASISWA" ? "bg-primary text-white" : "border border-border text-ink hover:bg-surface-alt"}`}
            >
              Mahasiswa
            </button>
            <button
              type="button"
              onClick={() => setPeran("ORTU_ASUH")}
              className={`rounded-lg px-3 py-1 text-sm transition-colors ${peran === "ORTU_ASUH" ? "bg-primary text-white" : "border border-border text-ink hover:bg-surface-alt"}`}
            >
              Orangtua Asuh
            </button>
          </div>

          <div className="mt-4">{peran === "MAHASISWA" ? <FormMahasiswa /> : <FormOrtuAsuh />}</div>

          <p className="mt-4 text-sm text-ink">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary underline hover:text-primary-dark">
              Masuk
            </Link>
          </p>
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
    return <p className="text-sm text-green-700">{state.pesan}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="email" label="Email" type="email" />
      <Input name="password" label="Kata sandi" type="password" />
      <Input name="nim" label="NIM" />
      <Input name="nama" label="Nama lengkap" />
      <Input name="fakultas" label="Fakultas" />
      <Input name="prodi" label="Program studi" />
      <Input name="angkatan" label="Angkatan" type="number" />
      <Input name="semesterBerjalan" label="Semester berjalan" type="number" />
      <Input name="noHp" label="No. HP" />
      <Input name="alamat" label="Alamat (opsional)" required={false} />

      {state.pesan && !state.sukses && (
        <p className="text-sm text-red-600" role="alert">
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Daftar sebagai mahasiswa"}
      </button>
    </form>
  );
}

function FormOrtuAsuh() {
  const [state, formAction, pending] = useActionState(
    actionOrtuAsuh,
    STATE_AWAL,
  );

  if (state.sukses) {
    return <p className="text-sm text-green-700">{state.pesan}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="email" label="Email" type="email" />
      <Input name="password" label="Kata sandi" type="password" />
      <Input name="nama" label="Nama lengkap" />

      <label className="flex flex-col gap-1">
        <span className="text-sm">Tipe</span>
        <select name="tipe" className="rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="INDIVIDU">Individu</option>
          <option value="DOSEN">Dosen</option>
          <option value="TENAGA_KEPENDIDIKAN">Tenaga Kependidikan</option>
          <option value="ALUMNI">Alumni</option>
          <option value="INSTANSI">Instansi</option>
        </select>
      </label>

      <Input name="instansi" label="Instansi (opsional)" required={false} />
      <Input name="noHp" label="No. HP" />
      <Input name="noHpAlternatif" label="No. HP alternatif" />
      <Input name="alamat" label="Alamat (opsional)" required={false} />
      <Input
        name="atasNamaMunfiq"
        label="Atas nama munfiq (opsional)"
        required={false}
      />

      {state.pesan && !state.sukses && (
        <p className="text-sm text-red-600" role="alert">
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? "Memproses..." : "Daftar sebagai orangtua asuh"}
      </button>
    </form>
  );
}

function Input({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}
