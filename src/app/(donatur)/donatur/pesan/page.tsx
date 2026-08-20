import Link from "next/link";
import { auth } from "@/lib/auth";
import { ambilRelasiUntukPesanOrtuAsuh } from "@/server/queries/pesan-binaan";
import { MessageCircle, ShieldAlert, ChevronRight, UserCheck, Inbox } from "lucide-react";

export default async function HalamanDaftarPesanDonatur() {
  const session = await auth();
  const relasiList = await ambilRelasiUntukPesanOrtuAsuh(session!.user.id);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Komunikasi & Pendampingan</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Pesan ke Mahasiswa Binaan
        </h1>
        <p className="text-sm text-muted">
          Kirimkan pesan motivasi, nasihat, atau silaturahmi kepada mahasiswa binaan Anda.
        </p>
      </div>

      {/* Peringatan Kebijakan Moderasi */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 shadow-xs">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="leading-relaxed">
          <p className="font-semibold text-amber-950">Aturan Perlindungan & Moderasi Pesan:</p>
          <p className="mt-0.5 text-amber-800">
            Demi menjaga kenyamanan dan etika pembinaan, seluruh pesan akan dimoderasi oleh admin sebelum diteruskan ke mahasiswa.
            <strong> Dilarang mencantumkan nomor telepon, alamat email, atau kontak pribadi langsung</strong>. Pesan yang memuat kontak akan otomatis ditolak oleh sistem.
          </p>
        </div>
      </div>

      {/* Daftar Kontak Binaan */}
      <div className="mt-8">
        <h2 className="font-heading text-base font-bold text-ink mb-3">
          Pilih Mahasiswa Binaan
        </h2>

        <div className="flex flex-col gap-3">
          {relasiList.map((r) => {
            const inisial = r.mahasiswa.nama
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <Link
                key={r.id}
                href={`/donatur/pesan/${r.id}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light font-heading text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {inisial}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-ink transition-colors group-hover:text-primary">
                      {r.mahasiswa.nama}
                    </h3>
                    <p className="text-xs text-muted">
                      NIM: <span className="font-mono text-ink/80">{r.mahasiswa.nim}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <span className="hidden sm:inline">Buka Percakapan</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt text-muted transition-all group-hover:bg-primary group-hover:text-white">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}

          {relasiList.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-12 text-center shadow-xs">
              <Inbox className="h-12 w-12 text-muted/40" />
              <h3 className="mt-3 font-heading text-base font-bold text-ink">
                Belum Ada Mahasiswa Binaan yang Siap Dikirimi Pesan
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted">
                Daftar mahasiswa akan tampil di sini setelah admin menugaskan relasi pembinaan dan mahasiswa memberikan persetujuan.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
