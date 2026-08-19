"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  registerMahasiswa,
  registerOrtuAsuh,
  type HasilRegistrasi,
} from "./actions";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Daftar</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPeran("MAHASISWA")}
          className={`rounded px-3 py-1 ${peran === "MAHASISWA" ? "bg-black text-white" : "border"}`}
        >
          Mahasiswa
        </button>
        <button
          type="button"
          onClick={() => setPeran("ORTU_ASUH")}
          className={`rounded px-3 py-1 ${peran === "ORTU_ASUH" ? "bg-black text-white" : "border"}`}
        >
          Orangtua Asuh
        </button>
      </div>

      {peran === "MAHASISWA" ? <FormMahasiswa /> : <FormOrtuAsuh />}

      <p className="text-sm">
        Sudah punya akun? <Link href="/login" className="underline">Masuk</Link>
      </p>
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
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
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
        <select name="tipe" className="rounded border px-3 py-2">
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
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
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
      <span className="text-sm">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="rounded border px-3 py-2"
      />
    </label>
  );
}
