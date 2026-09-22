"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { HasilAksi } from "@/types/aksi";
import { Tombol } from "@/components/ui/tombol";
import { unggahGambarLanding } from "./actions";
import type { JenisGambarLanding } from "@/lib/pengaturan-landing/schema";

const STATE_AWAL: HasilAksi = { sukses: false, pesan: "" };

const DAFTAR_SLOT: Array<{ jenis: JenisGambarLanding; label: string; fallback: string }> = [
  { jenis: "logo", label: "Logo Resmi UIKA", fallback: "/images/logo-uika.png" },
  { jenis: "heroFoto", label: "Foto Banner Hero", fallback: "/images/beasiswa-keluarga-1.jpg" },
  { jenis: "pimpinanFoto", label: "Foto Dewan Pimpinan", fallback: "/images/pimpinan-uika.jpg" },
  { jenis: "ceritaFoto", label: "Foto Cerita Donasi", fallback: "/images/beasiswa-keluarga-3.jpg" },
];

export function FormGambarLanding({ gambar }: { gambar: Partial<Record<JenisGambarLanding, string>> }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {DAFTAR_SLOT.map((slot) => (
        <SlotGambar key={slot.jenis} {...slot} urlSaatIni={gambar[slot.jenis]} />
      ))}
    </div>
  );
}

function SlotGambar({
  jenis,
  label,
  fallback,
  urlSaatIni,
}: {
  jenis: JenisGambarLanding;
  label: string;
  fallback: string;
  urlSaatIni?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => unggahGambarLanding(formData),
    STATE_AWAL,
  );

  return (
    <div className="rounded-xl border border-border/80 bg-surface-alt/30 p-3 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold text-ink">{label}</p>
          <span className="text-[10.5px] text-muted">Maks 5MB</span>
        </div>
        <div className="relative mb-2.5 h-24 w-full overflow-hidden rounded-lg bg-surface border border-border/70 shadow-2xs">
          <Image src={urlSaatIni || fallback} alt={label} fill className="object-cover" unoptimized={Boolean(urlSaatIni)} />
        </div>
      </div>
      <form action={formAction} className="flex flex-col gap-2 pt-1 border-t border-border/50">
        <input type="hidden" name="jenis" value={jenis} />
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-[11px] text-muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-border file:text-[11px] file:font-semibold file:bg-surface file:text-ink hover:file:bg-surface-alt cursor-pointer"
        />
        <div className="flex items-center justify-between">
          <Tombol type="submit" disabled={pending} variant="garis" ukuran="sm" className="w-fit text-xs py-1 px-2.5 font-semibold">
            {pending ? "Mengunggah..." : "Unggah & Ganti"}
          </Tombol>
          {state.pesan && (
            <span className={`text-[11px] font-medium ${state.sukses ? "text-green-700" : "text-red-600"}`}>
              {state.pesan}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
