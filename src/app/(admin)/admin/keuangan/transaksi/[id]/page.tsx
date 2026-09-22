import { notFound } from "next/navigation";
import Link from "next/link";
import { Receipt, Paperclip, ArrowLeft, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/lib/uang";
import { ambilTransaksiDetailAdmin } from "@/server/queries/transaksi";
import { ambilPeriodeUntukKomitmen } from "@/server/queries/komitmen";
import { Lencana } from "@/components/ui/lencana";
import { PanelVerifikasiTransaksi } from "./panel-verifikasi-transaksi";

const LABEL_STATUS: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  TERVERIFIKASI: "Terverifikasi",
  DITOLAK: "Ditolak",
  DIKEMBALIKAN: "Dikembalikan",
};

const NADA_STATUS: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_VERIFIKASI: "peringatan",
  TERVERIFIKASI: "sukses",
  DITOLAK: "bahaya",
  DIKEMBALIKAN: "netral",
};

export default async function HalamanReviewTransaksi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaksi = await ambilTransaksiDetailAdmin(id);

  if (!transaksi) {
    notFound();
  }

  const periodeList = transaksi.jadwalBayar ? [] : await ambilPeriodeUntukKomitmen();

  return (
    <div>
      {/* Header & Back */}
      <div className="mb-6 flex flex-col gap-2 border-b border-border pb-4">
        <Link
          href="/admin/keuangan/transaksi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Verifikasi Transaksi</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
              <Receipt className="h-3.5 w-3.5" />
              <span>Review Transaksi Mutasi</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
              {transaksi.ortuAsuh.atasNamaMunfiq || transaksi.ortuAsuh.nama}
            </h1>
          </div>
          <Lencana nada={NADA_STATUS[transaksi.status] ?? "netral"}>
            {LABEL_STATUS[transaksi.status] ?? transaksi.status}
          </Lencana>
        </div>
      </div>

      {/* 2-Column Side-by-Side Review Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (7 cols): Data Mutasi & Bukti */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-heading text-base font-bold text-ink">Informasi Setoran Donasi</h2>
              <span className="font-mono text-xs font-semibold text-primary">
                ID: {transaksi.id.slice(0, 8)}...
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="flex items-center gap-1.5 text-muted mb-1">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span>Nominal Setoran</span>
                </div>
                <div className="font-heading text-xl font-bold text-ink font-mono">
                  {formatRupiah(transaksi.nominal)}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="flex items-center gap-1.5 text-muted mb-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>Tanggal Pembayaran</span>
                </div>
                <div className="font-semibold text-ink text-sm">
                  {transaksi.tglBayar.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="text-muted mb-1">Metode Penyaluran</div>
                <div className="font-semibold text-ink text-sm">
                  {transaksi.metode.replace(/_/g, " ")}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-alt/40 p-3.5">
                <div className="text-muted mb-1">Peruntukan Donasi</div>
                <div className="font-semibold text-ink text-sm">
                  {transaksi.jadwalBayar
                    ? `Periode ${transaksi.jadwalBayar.periode.kode} (Angsuran #${transaksi.jadwalBayar.urutan})`
                    : "Donasi Bebas / Non-Jadwal"}
                </div>
              </div>
            </div>

            {/* Bukti Setoran Lampiran */}
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="font-heading text-sm font-bold text-ink mb-2">Lampiran Bukti Transfer</h3>
              {transaksi.buktiObjectKey ? (
                <div className="rounded-xl border border-border bg-surface-alt/60 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <Paperclip className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-ink">Dokumen Bukti Setoran</div>
                      <div className="text-[11px] text-muted">Tersimpan aman di penyimpanan objek</div>
                    </div>
                  </div>
                  <a
                    href={`/api/bukti-transaksi/${transaksi.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-primary-dark transition-colors"
                  >
                    <span>Buka Bukti</span>
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                  Tidak ada file lampiran bukti transfer (misal: setoran payroll otomatis atau manual via kasir).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Keputusan Verifikasi */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-ink">Keputusan Verifikator</h2>
            </div>

            {transaksi.status === "MENUNGGU_VERIFIKASI" ? (
              <PanelVerifikasiTransaksi
                transaksiId={transaksi.id}
                butuhPeriode={!transaksi.jadwalBayar}
                periodeList={periodeList}
              />
            ) : (
              <div className="rounded-xl bg-surface-alt/70 p-4 text-xs text-muted leading-relaxed">
                Transaksi ini telah berstatus <strong>{LABEL_STATUS[transaksi.status]}</strong>. Keputusan verifikasi telah disimpan dan tercatat di sistem buku kas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
