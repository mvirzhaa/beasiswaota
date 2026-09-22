import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Paperclip, ArrowLeft, ShieldCheck } from "lucide-react";
import { ambilLaporanDetailAdmin } from "@/server/queries/laporan-perkembangan";
import { Lencana } from "@/components/ui/lencana";
import { PanelReviewLaporan } from "./panel-review-laporan";

const LABEL_STATUS: Record<string, string> = {
  DRAFT: "Draft",
  DIKIRIM: "Dikirim",
  PERLU_REVISI: "Perlu Revisi",
  DIVERIFIKASI: "Diverifikasi",
};

const NADA_STATUS: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  DRAFT: "netral",
  DIKIRIM: "info",
  PERLU_REVISI: "peringatan",
  DIVERIFIKASI: "sukses",
};

export default async function HalamanReviewLaporan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const laporan = await ambilLaporanDetailAdmin(id);

  if (!laporan) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      {/* Header & Back */}
      <div className="mb-6 flex flex-col gap-2 border-b border-border pb-4">
        <Link
          href="/admin/laporan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Laporan</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Review Laporan Studi</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
              {laporan.mahasiswa.nama}
            </h1>
            <p className="mt-0.5 text-xs text-muted font-mono">
              NIM: {laporan.mahasiswa.nim} · {laporan.mahasiswa.fakultas} · {laporan.mahasiswa.prodi}
            </p>
          </div>
          <Lencana nada={NADA_STATUS[laporan.status] ?? "netral"}>
            {LABEL_STATUS[laporan.status] ?? laporan.status}
          </Lencana>
        </div>
      </div>

      {/* 2-Column Side-by-Side Review Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (7 cols): Isi Laporan & Dokumen */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-heading text-base font-bold text-ink">Catatan Perkembangan Studi</h2>
              <span className="rounded-md bg-surface-alt px-2 py-0.5 text-xs font-medium text-muted">
                Periode {laporan.periode.kode}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface-alt/40 p-4 text-xs">
              <p className="whitespace-pre-wrap leading-relaxed text-ink">
                {laporan.isi || "Tidak ada catatan tertulis yang dilampirkan oleh mahasiswa."}
              </p>
            </div>

            {/* Lampiran Scan KHS */}
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="font-heading text-sm font-bold text-ink mb-2">Lampiran Berkas KHS</h3>
              {laporan.lampiranKey ? (
                <div className="rounded-xl border border-border bg-surface-alt/60 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <Paperclip className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-ink">Scan Kartu Hasil Studi (KHS)</div>
                      <div className="text-[11px] text-muted">Format PDF / Gambar Dokumen Nilai</div>
                    </div>
                  </div>
                  <a
                    href={`/api/lampiran-laporan/${laporan.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-primary-dark transition-colors"
                  >
                    <span>Buka Berkas</span>
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                  Belum ada file scan KHS yang diunggah untuk periode ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Keputusan Review */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-ink">Keputusan Verifikasi</h2>
            </div>

            <div className="mb-4 rounded-xl border border-border bg-surface-alt/40 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Batas Pengiriman:</span>
                <span className="font-semibold text-ink">
                  {laporan.batasKirim.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status Saat Ini:</span>
                <span className="font-bold text-ink">{LABEL_STATUS[laporan.status]}</span>
              </div>
            </div>

            {laporan.status === "DIKIRIM" ? (
              <PanelReviewLaporan laporanId={laporan.id} />
            ) : (
              <div className="rounded-xl bg-surface-alt/70 p-4 text-xs text-muted leading-relaxed">
                Laporan ini berstatus <strong>{LABEL_STATUS[laporan.status]}</strong>. Hasil review telah disimpan dalam riwayat akademik mahasiswa.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
