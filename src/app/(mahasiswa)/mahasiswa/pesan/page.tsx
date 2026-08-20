import Link from "next/link";
import { auth } from "@/lib/auth";
import { ambilRelasiUntukPesanMahasiswa } from "@/server/queries/pesan-binaan";
import { MessageCircle, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";

export default async function HalamanDaftarPesanMahasiswa() {
  const session = await auth();
  const relasiList = await ambilRelasiUntukPesanMahasiswa(session!.user.id);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Komunikasi & Silaturahmi</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Pesan Binaan & Orang Tua Asuh
        </h1>
        <p className="text-sm text-muted">
          Kirimkan ucapan terima kasih atau konsultasi studi kepada Orang Tua Asuh pendamping Anda.
        </p>
      </div>

      {/* Info Kebijakan Moderasi & Kontak */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950 shadow-xs">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="leading-relaxed">
          <p className="font-bold">Ketentuan Komunikasi & Moderasi Pesan:</p>
          <p className="mt-0.5 text-amber-800">
            Semua pesan dimoderasi oleh admin sebelum diteruskan kepada Orang Tua Asuh. Dilarang mencantumkan nomor telepon, nomor rekening pribadi, atau email — pesan yang mengandung kontak pribadi akan otomatis ditolak oleh sistem.
          </p>
        </div>
      </div>

      {/* Daftar Percakapan */}
      <div className="mt-8 flex flex-col gap-3">
        {relasiList.map((r) => {
          const namaOrtu = r.ortuAsuh.anonim
            ? "Donatur Orang Tua Asuh (Anonim)"
            : r.ortuAsuh.atasNamaMunfiq || r.ortuAsuh.nama;

          return (
            <Link
              key={r.id}
              href={`/mahasiswa/pesan/${r.id}`}
              className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary font-bold text-base shadow-xs group-hover:bg-primary group-hover:text-white transition-colors">
                  {namaOrtu.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-heading text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {namaOrtu}
                  </h2>
                  <p className="text-xs text-muted">
                    Buka percakapan dan riwayat pesan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <span className="hidden sm:inline">Buka Percakapan</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}

        {relasiList.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface py-16 text-center shadow-xs">
            <UserCheck className="h-12 w-12 text-muted/40" />
            <h2 className="mt-3 font-heading text-lg font-bold text-ink">Belum Ada Percakapan Aktif</h2>
            <p className="mt-1 max-w-md text-xs text-muted">
              Fitur pesan akan aktif setelah Anda memiliki relasi pembinaan yang disetujui bersama Orang Tua Asuh.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
