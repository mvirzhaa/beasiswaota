"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogIn, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { loginAction, type HasilLogin } from "./actions";
import { FooterProgram } from "@/components/ui/footer-program";
import { Tombol } from "@/components/ui/tombol";

const STATE_AWAL: HasilLogin = {};

export default function HalamanLogin() {
  return (
    <Suspense fallback={null}>
      <FormLogin />
    </Suspense>
  );
}

function FormLogin() {
  const [state, formAction, pending] = useActionState(loginAction, STATE_AWAL);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-primary-light via-surface-alt to-accent/10">
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_15px_50px_rgba(0,0,0,0.08)] grid grid-cols-1 md:grid-cols-12">
          {/* Kolom Kiri: Visual Banner Beasiswa */}
          <div className="relative hidden md:flex md:col-span-6 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] p-8 text-white">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/images/logo-uika.png"
                  alt="Logo UIKA"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain drop-shadow-md"
                />
                <div>
                  <span className="block font-heading text-lg font-bold leading-none text-white">
                    UIKA Bogor
                  </span>
                  <span className="text-[11px] font-medium text-accent">Beasiswa Orangtua Asuh</span>
                </div>
              </div>

              <div className="mt-8">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent backdrop-blur-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>Program Mulia Ta&apos;awun</span>
                </span>
                <h2 className="mt-2 font-heading text-2xl font-bold leading-snug text-white">
                  Menjembatani Asa, Mewujudkan Masa Depan
                </h2>
                <p className="mt-2 text-xs text-white/80 leading-relaxed">
                  Platform resmi pengelolaan beasiswa dan pendampingan mahasiswa Universitas Ibn Khaldun Bogor.
                </p>
              </div>
            </div>

            {/* Foto Cerita Mahasiswa */}
            <div className="relative z-10 mt-6">
              <div className="overflow-hidden rounded-2xl border border-white/20 shadow-lg">
                <Image
                  src="/images/beasiswa-keluarga-2.jpg"
                  alt="Mahasiswa dan Keluarga Beasiswa UIKA"
                  width={500}
                  height={350}
                  className="h-44 w-full object-cover"
                />
              </div>
              <p className="mt-3 text-center text-[11px] text-white/70 italic">
                &ldquo;Dukungan Anda mengantarkan generasi muda meraih kesuksesan akademik.&rdquo;
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Form Login */}
          <div className="p-6 sm:p-10 md:col-span-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 md:hidden mb-6">
              <Image
                src="/images/logo-uika.png"
                alt="Logo UIKA"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <div>
                <span className="block font-heading text-base font-bold text-primary">UIKA Bogor</span>
                <span className="block text-xs text-muted">Beasiswa Orangtua Asuh</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-wider text-accent-dark uppercase">
                Portal Akses
              </p>
              <h1 className="mt-1 font-heading text-2xl font-bold text-ink">
                Masuk ke Sistem
              </h1>
              <p className="mt-1 text-xs text-muted">
                Silakan masuk dengan email dan kata sandi terdaftar.
              </p>
            </div>

            <form action={formAction} className="mt-6 flex flex-col gap-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink">Alamat Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="nama@email.com"
                  className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Kata Sandi</span>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              {state.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
                  {state.error}
                </div>
              )}

              <Tombol
                type="submit"
                disabled={pending}
                variant="primer"
                ukuran="lg"
                className="mt-2 w-full font-bold shadow-md"
              >
                <LogIn className="h-4 w-4" />
                <span>{pending ? "Memproses Masuk..." : "Masuk"}</span>
              </Tombol>
            </form>

            <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 text-center text-xs text-ink">
              <div>
                Belum memiliki akun?{" "}
                <Link href="/register" className="font-bold text-primary underline hover:text-primary-dark">
                  Daftar Sekarang
                </Link>
              </div>
              <div className="mt-1">
                <Link href="/" className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink transition-colors">
                  <span>&larr; Kembali ke Halaman Utama</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterProgram />
    </main>
  );
}
