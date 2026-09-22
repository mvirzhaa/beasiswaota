import Link from "next/link";
import Image from "next/image";
import { HeartHandshake } from "lucide-react";
import { auth } from "@/lib/auth";
import { FooterProgram } from "@/components/ui/footer-program";
import { ambilKandidatEarmarkPublik } from "@/server/queries/donasi-publik";
import { FormPendaftaranDonatur } from "./form-pendaftaran";

// Wajib dinamis: daftar kandidat mahasiswa untuk earmark harus selalu
// terkini per-request. Tanpa ini, halaman publik (tidak ada auth() yang
// otomatis memaksa dynamic rendering) akan di-prerender statis saat build
// dan daftar penerima jadi beku sampai deploy berikutnya.
export const dynamic = "force-dynamic";

export default async function HalamanRegister() {
  const [kandidatList, session] = await Promise.all([
    ambilKandidatEarmarkPublik(),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-primary-light via-surface-alt to-accent/10">
      {/* Banner Khusus Jika Sedang Login Admin (Mode Pratinjau Publik) */}
      {isAdmin && (
        <div className="sticky top-0 z-[60] bg-navy px-4 py-2 text-center text-xs font-medium text-white shadow-sm flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mode Publik: Formulir Pendaftaran Donatur. Anda sedang terhubung sebagai <strong>Admin Pengelola</strong>.</span>
          </span>
          <Link
            href="/admin"
            className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-accent transition-colors hover:bg-white/25 hover:text-white"
          >
            Buka Dashboard Admin &rarr;
          </Link>
        </div>
      )}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-uika.png"
              alt="Logo UIKA"
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-xs"
              priority
            />
            <div>
              <span className="block font-heading text-lg font-bold leading-none text-primary">
                UIKA Bogor
              </span>
              <span className="text-xs font-medium text-muted">Program Beasiswa Orangtua Asuh</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent-dark">
                <HeartHandshake className="h-4 w-4" />
              </span>
              <h1 className="font-heading text-2xl font-bold text-ink">
                Daftar Sebagai Orang Tua Asuh
              </h1>
            </div>
            <p className="mt-2 text-xs text-muted">
              Formulir ini murni untuk donasi (orang tua asuh) — tidak membuat akun/login.
              Pendaftaran mahasiswa calon penerima beasiswa dikelola sepenuhnya oleh admin
              pengelola program.
            </p>
          </div>

          <div className="mt-6">
            <FormPendaftaranDonatur kandidatList={kandidatList} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-ink">
            <Link href="/" className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink transition-colors">
              <span>&larr; Kembali ke Halaman Utama</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="font-semibold text-primary hover:underline flex items-center gap-1">
                <span>Dashboard Admin &rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      <FooterProgram />
    </main>
  );
}
