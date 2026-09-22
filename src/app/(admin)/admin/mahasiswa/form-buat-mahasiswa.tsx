"use client";

import { useActionState, useRef, useState } from "react";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { buatMahasiswa } from "./actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function FormBuatMahasiswa() {
  const [terbuka, setTerbuka] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await buatMahasiswa(formData);
      if (hasil.sukses) {
        formRef.current?.reset();
        setTerbuka(false);
      }
      return hasil;
    },
    STATE_AWAL,
  );

  if (!terbuka) {
    return (
      <Tombol variant="primer" ukuran="sm" onClick={() => setTerbuka(true)}>
        + Tambah Mahasiswa
      </Tombol>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2"
    >
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

      <div className="flex gap-2 sm:col-span-2">
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm">
          {pending ? "Menyimpan..." : "Simpan Mahasiswa"}
        </Tombol>
        <Tombol type="button" variant="garis" ukuran="sm" onClick={() => setTerbuka(false)}>
          Batal
        </Tombol>
      </div>
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
