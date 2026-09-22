"use client";

import { useActionState } from "react";
import type { Mahasiswa } from "@prisma/client";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { ubahMahasiswa } from "../actions";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const KELAS_INPUT =
  "rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function FormUbahMahasiswa({ mahasiswa }: { mahasiswa: Mahasiswa }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => ubahMahasiswa(mahasiswa.id, formData),
    STATE_AWAL,
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Kolom name="nim" label="NIM" defaultValue={mahasiswa.nim} />
      <Kolom name="nama" label="Nama lengkap" defaultValue={mahasiswa.nama} />
      <Kolom name="fakultas" label="Fakultas" defaultValue={mahasiswa.fakultas} />
      <Kolom name="prodi" label="Program studi" defaultValue={mahasiswa.prodi} />
      <Kolom name="angkatan" label="Angkatan" type="number" defaultValue={String(mahasiswa.angkatan)} />
      <Kolom
        name="semesterBerjalan"
        label="Semester berjalan"
        type="number"
        defaultValue={String(mahasiswa.semesterBerjalan)}
      />
      <Kolom name="noHp" label="No. HP" defaultValue={mahasiswa.noHp} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink">Status Akademik</span>
        <select name="statusAkademik" defaultValue={mahasiswa.statusAkademik} className={KELAS_INPUT}>
          <option value="AKTIF">Aktif</option>
          <option value="CUTI">Cuti</option>
          <option value="LULUS">Lulus</option>
          <option value="DO">Drop Out</option>
        </select>
      </label>
      <div className="sm:col-span-2">
        <Kolom name="alamat" label="Alamat (opsional)" required={false} defaultValue={mahasiswa.alamat ?? ""} />
      </div>

      {state.pesan && (
        <p className={`sm:col-span-2 text-sm ${state.sukses ? "text-green-700" : "text-red-600"}`} role="alert">
          {state.pesan}
        </p>
      )}

      <div className="sm:col-span-2">
        <Tombol type="submit" disabled={pending} variant="primer" ukuran="sm">
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
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
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-ink">{label}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className={KELAS_INPUT} />
    </label>
  );
}
