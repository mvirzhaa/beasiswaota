"use client";

import { useActionState, useRef } from "react";
import type { HasilAksi } from "@/types/aksi";
import { daftarkanMahasiswaOlehAdmin } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function FormDaftarkanMahasiswa() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await daftarkanMahasiswaOlehAdmin(formData);
      if (hasil.sukses) formRef.current?.reset();
      return hasil;
    },
    STATE_AWAL,
  );

  return (
    <form ref={formRef} action={formAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Kolom name="email" label="Email" type="email" />
      <Kolom name="nim" label="NIM (boleh sementara)" />
      <Kolom name="nama" label="Nama lengkap" />
      <Kolom name="fakultas" label="Fakultas" />
      <Kolom name="prodi" label="Program studi" />
      <Kolom name="angkatan" label="Angkatan" type="number" />
      <Kolom name="semesterBerjalan" label="Semester berjalan" type="number" />
      <Kolom name="noHp" label="No. HP" />
      <div className="sm:col-span-2">
        <Kolom name="alamat" label="Alamat (opsional)" required={false} />
      </div>

      {state.pesan && (
        <p
          className={`sm:col-span-2 text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`}
          role="alert"
        >
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-dark disabled:opacity-50 sm:col-span-2"
      >
        {pending ? "Mendaftarkan..." : "Daftarkan mahasiswa"}
      </button>
    </form>
  );
}

function Kolom({
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-ink">{label}</span>
      <input name={name} type={type} required={required} className={KELAS_INPUT} />
    </label>
  );
}
