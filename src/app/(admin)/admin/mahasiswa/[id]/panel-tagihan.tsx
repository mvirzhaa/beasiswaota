"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { formatRupiah } from "@/lib/uang";
import { Lencana } from "@/components/ui/lencana";
import { Tombol } from "@/components/ui/tombol";
import { FormTagihan } from "./form-tagihan";

const NADA_STATUS_TAGIHAN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  BELUM_LUNAS: "netral",
  LUNAS_SEBAGIAN: "peringatan",
  LUNAS: "sukses",
  DIBATALKAN: "bahaya",
};

// Bentuk data yang sudah "diratakan" ke string di server (page.tsx) — Tagihan
// asli punya field BigInt (nominal/terbayar) yang tidak bisa lewat batas
// Server->Client Component, jadi konversi dilakukan sebelum sampai di sini.
export interface BarisTagihanTampilan {
  id: string;
  komponen: string;
  periodeId: string;
  periodeKode: string;
  nominal: string;
  terbayar: string;
  status: string;
  jatuhTempoIso: string;
}

export function PanelTagihan({
  mahasiswaId,
  periodeList,
  tagihanList,
  totalTagihanTampilan,
  totalTerbayarTampilan,
}: {
  mahasiswaId: string;
  periodeList: { id: string; kode: string }[];
  tagihanList: BarisTagihanTampilan[];
  totalTagihanTampilan: string;
  totalTerbayarTampilan: string;
}) {
  const [modeTambah, setModeTambah] = useState(false);
  const [idDiubah, setIdDiubah] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="font-heading text-base font-bold text-ink">Tagihan Biaya Kuliah (UKT)</h3>
          <p className="text-xs text-muted">Daftar kewajiban pembayaran UKT mahasiswa per semester.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-lg bg-surface-alt px-2.5 py-1 text-muted">
            Total: <strong className="text-ink">{totalTagihanTampilan}</strong>
          </span>
          <span className="rounded-lg bg-emerald-50 text-emerald-800 px-2.5 py-1 font-semibold">
            Terbayar: {totalTerbayarTampilan}
          </span>
          <Tombol
            type="button"
            variant="garis"
            ukuran="sm"
            onClick={() => {
              setModeTambah((v) => !v);
              setIdDiubah(null);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Tagihan</span>
          </Tombol>
        </div>
      </div>

      {modeTambah && (
        <div className="rounded-xl border border-primary/30 bg-primary-light/20 p-4">
          <FormTagihan mahasiswaId={mahasiswaId} periodeList={periodeList} onSelesai={() => setModeTambah(false)} />
        </div>
      )}

      <div className="divide-y divide-border/60">
        {tagihanList.map((t) => (
          <div key={t.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-xs sm:text-sm">{t.komponen}</span>
                  <span className="rounded-md bg-surface-alt px-1.5 py-0.5 text-[10.5px] font-medium text-muted">
                    Periode {t.periodeKode}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  Nominal: <span className="font-semibold text-ink">{formatRupiah(BigInt(t.nominal))}</span> ·
                  Terbayar: <span className="font-semibold text-emerald-700">{formatRupiah(BigInt(t.terbayar))}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Lencana nada={NADA_STATUS_TAGIHAN[t.status] ?? "netral"}>{t.status}</Lencana>
                <button
                  type="button"
                  onClick={() => {
                    setIdDiubah((cur) => (cur === t.id ? null : t.id));
                    setModeTambah(false);
                  }}
                  className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-primary hover:text-primary"
                  title="Ubah tagihan"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {idDiubah === t.id && (
              <div className="mt-3 rounded-xl border border-primary/30 bg-primary-light/20 p-4">
                <FormTagihan
                  mahasiswaId={mahasiswaId}
                  periodeList={periodeList}
                  tagihan={{
                    id: t.id,
                    periodeId: t.periodeId,
                    komponen: t.komponen,
                    nominal: t.nominal,
                    jatuhTempoIso: t.jatuhTempoIso,
                  }}
                  onSelesai={() => setIdDiubah(null)}
                />
              </div>
            )}
          </div>
        ))}
        {tagihanList.length === 0 && (
          <p className="py-8 text-center text-xs text-muted">Belum ada tagihan UKT terdaftar.</p>
        )}
      </div>
    </div>
  );
}
