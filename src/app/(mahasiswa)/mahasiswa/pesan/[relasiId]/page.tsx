import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ambilPesanRelasiUntukUser } from "@/server/queries/pesan-binaan";
import { Lencana } from "@/components/ui/lencana";
import { MessageCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { FormKirimPesan } from "./form-kirim-pesan";

const NADA_STATUS_PESAN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  PENDING: "peringatan",
  DISETUJUI: "sukses",
  DITOLAK: "bahaya",
};

const LABEL_STATUS_PESAN: Record<string, string> = {
  PENDING: "Menunggu Moderasi",
  DISETUJUI: "Tersampaikan",
  DITOLAK: "Ditolak",
};

export default async function HalamanThreadPesanMahasiswa({
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

  const namaLawan = hasil.relasi.ortuAsuh.atasNamaMunfiq || hasil.relasi.ortuAsuh.nama;

  return (
    <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
      {/* Header Thread */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/mahasiswa/pesan"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-ink transition-colors hover:bg-surface-alt"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              <span>Percakapan Pembinaan</span>
            </div>
            <h1 className="font-heading text-xl font-bold text-ink sm:text-2xl">
              {namaLawan}
            </h1>
          </div>
        </div>
      </div>

      {/* Warning Info */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>
          Pesan akan ditinjau oleh verifikator sebelum diteruskan. Jangan cantumkan data kontak pribadi.
        </p>
      </div>

      {/* Daftar Pesan */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs min-h-[250px]">
        {hasil.pesan.map((p) => {
          const isMe = p.pengirimId === session!.user.id;
          return (
            <div
              key={p.id}
              className={`flex flex-col max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs ${
                isMe
                  ? "self-end bg-primary-light/60 border border-primary/20 text-ink rounded-tr-xs"
                  : "self-start bg-surface-alt border border-border text-ink rounded-tl-xs"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.isi}</p>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px]">
                <span className="text-muted font-mono">
                  {p.createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })},{" "}
                  {p.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>
                <Lencana nada={NADA_STATUS_PESAN[p.status] ?? "netral"}>
                  {LABEL_STATUS_PESAN[p.status] ?? p.status}
                </Lencana>
              </div>
              {p.status === "DITOLAK" && p.alasanTolak && (
                <div className="mt-2 rounded-lg bg-red-100 p-2 text-xs text-red-800">
                  <strong>Alasan Penolakan:</strong> {p.alasanTolak}
                </div>
              )}
            </div>
          );
        })}

        {hasil.pesan.length === 0 && (
          <div className="my-auto py-8 text-center text-xs text-muted">
            Belum ada pesan dalam percakapan ini. Mulai kirim sapaan santun kepada Orang Tua Asuh.
          </div>
        )}
      </div>

      {/* Form Kirim Pesan */}
      <div className="mt-4">
        <FormKirimPesan relasiId={relasiId} />
      </div>
    </main>
  );
}
