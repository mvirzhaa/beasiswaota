import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ambilPesanRelasiUntukUser } from "@/server/queries/pesan-binaan";
import { Lencana } from "@/components/ui/lencana";
import { ArrowLeft, MessageCircle, AlertCircle, Clock } from "lucide-react";
import { FormKirimPesan } from "./form-kirim-pesan";

const LABEL_STATUS_PESAN: Record<string, string> = {
  MENUNGGU_MODERASI: "Menunggu Moderasi",
  DITERUSKAN: "Telah Diteruskan",
  DITOLAK: "Ditolak",
};

const NADA_STATUS_PESAN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_MODERASI: "peringatan",
  DITERUSKAN: "sukses",
  DITOLAK: "bahaya",
};

export default async function HalamanThreadPesanDonatur({
  params,
}: {
  params: Promise<{ relasiId: string }>;
}) {
  const { relasiId } = await params;
  const session = await auth();

  const hasil = await ambilPesanRelasiUntukUser(relasiId, {
    id: session!.user.id,
    role: session!.user.role,
  });
  if (!hasil) {
    notFound();
  }

  const inisial = hasil.relasi.mahasiswa.nama
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
      {/* Tombol Kembali & Header Percakapan */}
      <div className="flex items-center gap-3 border-b border-border pb-5">
        <Link
          href="/donatur/pesan"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-ink transition-colors hover:bg-surface-alt hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark font-heading text-sm font-bold text-white shadow-xs">
            {inisial}
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">
              {hasil.relasi.mahasiswa.nama}
            </h1>
            <p className="text-xs text-muted">
              Mahasiswa Binaan UIKA Bogor
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Gelembung Pesan */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
          Riwayat Pesan
        </h2>

        <div className="flex flex-col gap-4">
          {hasil.pesan.map((p) => {
            const isDitolak = p.status === "DITOLAK";
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-4 text-sm transition-all ${
                  isDitolak
                    ? "border border-red-200 bg-red-50/40"
                    : "border border-border bg-surface-alt/40"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-ink">{p.isi}</p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 opacity-60" />
                    {p.createdAt.toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Lencana nada={NADA_STATUS_PESAN[p.status] ?? "netral"}>
                    {LABEL_STATUS_PESAN[p.status] ?? p.status}
                  </Lencana>
                </div>

                {isDitolak && p.alasanTolak && (
                  <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-red-100/60 p-2 text-xs font-medium text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Catatan Moderasi Admin: {p.alasanTolak}</span>
                  </div>
                )}
              </div>
            );
          })}

          {hasil.pesan.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageCircle className="h-10 w-10 text-muted/40" />
              <p className="mt-2 text-sm font-medium text-ink">Belum Ada Riwayat Pesan</p>
              <p className="mt-0.5 text-xs text-muted">
                Tulis pesan pertama Anda untuk menyapa dan memberikan motivasi kepada mahasiswa binaan.
              </p>
            </div>
          )}
        </div>

        {/* Form Kirim Pesan Baru */}
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-heading text-sm font-bold text-ink mb-2">Tulis Pesan Baru</h3>
          <FormKirimPesan relasiId={relasiId} />
        </div>
      </div>
    </main>
  );
}
