import type { Periode } from "@prisma/client";
import type { BarisPengeluaranLain } from "@/server/queries/pengeluaran-lain";
import { formatRupiah } from "@/lib/uang";
import { ModalTambahPengeluaran } from "./modal-tambah-pengeluaran";
import { Receipt, ReceiptText } from "lucide-react";

interface TabelPengeluaranProps {
  daftar: BarisPengeluaranLain[];
  periodeList: Periode[];
}

export function TabelPengeluaran({ daftar, periodeList }: TabelPengeluaranProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
      {/* Header Tabel */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border px-5 py-3.5 bg-surface">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-bold text-ink">Daftar Pengeluaran</h2>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            Menampilkan {daftar.length} data riwayat pengeluaran kas
          </p>
        </div>

        <ModalTambahPengeluaran periodeList={periodeList} />
      </div>

      {/* Tabel Data */}
      <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-surface-alt/90 backdrop-blur-xs">
            <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted">
              <th className="py-3 pl-5 pr-4">Tanggal</th>
              <th className="py-3 px-4">Periode</th>
              <th className="py-3 px-4">Keterangan</th>
              <th className="py-3 px-4">Dicatat Oleh</th>
              <th className="py-3 pl-4 pr-5 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {daftar.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-surface-alt/50">
                <td className="py-3 pl-5 pr-4 font-mono text-muted whitespace-nowrap">
                  {p.createdAt.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-block rounded-md bg-surface-alt px-2 py-0.5 font-mono font-medium text-ink">
                    {p.periodeKode}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-ink max-w-md">
                  {p.keterangan}
                </td>
                <td className="py-3 px-4 text-muted whitespace-nowrap">
                  {p.dicatatOleh}
                </td>
                <td className="py-3 pl-4 pr-5 text-right font-mono font-bold text-red-600 whitespace-nowrap">
                  -{formatRupiah(p.nominal)}
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted">
                  <ReceiptText className="mx-auto h-8 w-8 text-muted/40 mb-2" />
                  <p className="font-semibold text-ink">Belum ada data pengeluaran</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Gunakan tombol &quot;Tambah Pengeluaran&quot; untuk mencatat pengeluaran kas.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
