import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  ArrowRight,
  Sparkles,
  ScrollText,
  Landmark,
  PhoneCall,
  MessageCircle,
  CheckCircle2,
  UserPlus,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { Tombol } from "@/components/ui/tombol";
import { FooterProgram } from "@/components/ui/footer-program";
import { ambilPengaturanLanding } from "@/server/queries/pengaturan-landing";
import { keFormatWaMe } from "@/lib/telepon";

const PESAN_WA_KONFIRMASI = encodeURIComponent(
  "Assalamu'alaikum Warahmatullahi Wabarakatuh, saya ingin konfirmasi transfer donasi Program Beasiswa Orang Tua Asuh UIKA Bogor.",
);

export default async function HalamanUtamaLandingPage() {
  const [session, landing] = await Promise.all([auth(), ambilPengaturanLanding()]);
  const isAdmin = session?.user?.role === "ADMIN";
  const logo = landing.gambar.logo || "/images/logo-uika.png";
  const kontak1 = landing.kontak[0];
  const kontak2 = landing.kontak[1];

  return (
    <div className="flex min-h-screen flex-col bg-surface-alt font-sans text-ink">
      {/* Banner Khusus Jika Sedang Login Admin (Mode Pratinjau Publik) */}
      {isAdmin && (
        <div className="sticky top-0 z-[60] bg-navy px-4 py-2 text-center text-xs font-medium text-white shadow-sm flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mode Publik: Anda sedang terhubung sebagai <strong>Admin Pengelola</strong>.</span>
          </span>
          <Link
            href="/admin"
            className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-accent transition-colors hover:bg-white/25 hover:text-white"
          >
            Buka Dashboard Admin &rarr;
          </Link>
        </div>
      )}

      {/* 1. Header / Navbar Publik */}
      <header className={`sticky ${isAdmin ? "top-[36px]" : "top-0"} z-50 border-b border-border bg-surface/95 backdrop-blur-md shadow-xs transition-all`}>
        <div className="h-1 bg-gradient-to-r from-primary via-[#116e63] to-accent" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Image
                src={logo}
                alt="Logo Resmi UIKA Bogor"
                width={40}
                height={40}
                className="h-10 w-10 object-contain drop-shadow-xs"
                unoptimized={Boolean(landing.gambar.logo)}
                priority
              />
            </div>
            <div>
              <span className="block font-heading text-lg font-bold leading-tight text-primary">
                UIKA Bogor
              </span>
              <span className="block text-xs font-medium text-muted">Beasiswa Orangtua Asuh</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-ink/80">
            <a href="#tentang" className="transition-colors hover:text-primary">Tentang Program</a>
            <a href="#daftar" className="transition-colors hover:text-primary">Pendaftaran</a>
            <a href="#pimpinan" className="transition-colors hover:text-primary">Pimpinan UIKA</a>
            <a href="#pilar" className="transition-colors hover:text-primary">4 Pilar Sistem</a>
            <a href="#rekening" className="transition-colors hover:text-primary">Rekening Donasi</a>
            <Link href="/brosur" className="transition-colors text-primary font-bold hover:text-primary-dark flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>Brosur</span>
            </Link>
          </nav>

          {isAdmin && (
            <div className="flex items-center gap-2.5">
              <Link href="/admin">
                <Tombol variant="primer" ukuran="sm" className="font-bold shadow-xs flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard Admin</span>
                </Tombol>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2. Hero Section: Visual Split Banner */}
      <section id="tentang" className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] py-14 sm:py-20 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-white/10 blur-2xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-accent uppercase backdrop-blur-xs">
                <Image
                  src={logo}
                  alt="Logo UIKA"
                  width={18}
                  height={18}
                  className="h-4.5 w-4.5 object-contain"
                  unoptimized={Boolean(landing.gambar.logo)}
                />
                <span>Program Resmi Universitas Ibn Khaldun Bogor</span>
              </div>

              <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-5xl lg:leading-tight">
                {landing.hero.judul}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-white/90 leading-relaxed max-w-xl">
                {landing.hero.deskripsi}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <a href="#daftar">
                  <Tombol variant="aksen" ukuran="lg" className="font-bold shadow-lg text-ink">
                    <UserPlus className="h-5 w-5" />
                    <span>Daftar Jadi Donatur</span>
                  </Tombol>
                </a>
                <Link href="/brosur">
                  <Tombol variant="garis" ukuran="lg" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                    <FileText className="h-5 w-5" />
                    <span>Lihat Brosur & PDF</span>
                  </Tombol>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-white/20 pt-6 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Model Dana Terpadu (Pooling)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>Skoring Objektif & Transparan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span>SK Rektor No. 796/KEP/UIKA/2026</span>
                </div>
              </div>
            </div>

            {/* Foto Cerita Beasiswa */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border-2 border-white/20 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                <Image
                  src={landing.gambar.heroFoto || "/images/beasiswa-keluarga-1.jpg"}
                  alt="Orang Tua Asuh Mendukung Mimpi Meraih Masa Depan"
                  width={700}
                  height={500}
                  className="h-80 sm:h-96 w-full object-cover"
                  unoptimized={Boolean(landing.gambar.heroFoto)}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/50 p-4 backdrop-blur-xs text-xs text-white/95 border border-white/15">
                  <p className="font-semibold text-accent flex items-center gap-1.5 text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>Orang Tua Asuh Mendukung Mimpi</span>
                  </p>
                  <p className="mt-1 text-xs text-white/85 leading-relaxed">
                    Setiap bantuan Anda menghidupkan harapan satu keluarga untuk mengantarkan putra-putrinya meraih gelar sarjana di UIKA Bogor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARD PENDAFTARAN ORANG TUA ASUH */}
      <section id="daftar" className="py-14 sm:py-18 bg-surface border-b border-border/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3.5 py-1 text-xs font-bold text-primary uppercase">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Pendaftaran Donatur Terbuka</span>
            </span>
            <h2 className="mt-3 font-heading text-2xl sm:text-4xl font-bold text-ink">
              Bergabung Dalam Program
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Pendaftaran mandiri hanya untuk orang tua asuh (donatur). Calon penerima beasiswa
              didata langsung oleh admin pengelola program.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-md">
            {/* Card: Pendaftaran Orang Tua Asuh */}
            <div className="group flex flex-col justify-between rounded-2xl border-2 border-border bg-surface p-8 sm:p-10 shadow-xs transition-all duration-200 hover:border-accent hover:shadow-lg">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-ink shadow-md transition-transform group-hover:scale-105">
                    <HeartHandshake className="h-8 w-8" />
                  </div>
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent-dark">
                    Amal Jariyah
                  </span>
                </div>

                <h3 className="mt-6 font-heading text-2xl font-bold text-ink group-hover:text-primary transition-colors">
                  Daftar Sebagai Orang Tua Asuh
                </h3>
                <p className="text-xs font-semibold text-accent-dark uppercase tracking-wider mt-1">
                  Dosen, Tendik, Alumni, Instansi & Masyarakat Umum
                </p>
              </div>

              <div className="mt-8 pt-4">
                <Link href="/register?peran=ORTU_ASUH" className="block">
                  <Tombol variant="aksen" ukuran="lg" className="w-full font-bold justify-center text-sm py-3.5 text-ink shadow-md">
                    <span>Daftar Sebagai Orang Tua Asuh</span>
                    <ArrowRight className="h-4 w-4" />
                  </Tombol>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Amanah & Pimpinan UIKA Bogor */}
      <section id="pimpinan" className="py-16 bg-surface-alt">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Foto Pimpinan */}
            <div className="lg:col-span-5 bg-surface-alt/80 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-border">
              <div className="relative overflow-hidden rounded-2xl shadow-md border border-border bg-white w-full max-w-md">
                <Image
                  src={landing.gambar.pimpinanFoto || "/images/pimpinan-uika.jpg"}
                  alt="Pimpinan Universitas Ibn Khaldun Bogor 2024-2028"
                  width={700}
                  height={500}
                  className="w-full h-auto object-cover"
                  unoptimized={Boolean(landing.gambar.pimpinanFoto)}
                />
                <div className="bg-navy p-3 text-center text-xs text-white">
                  <p className="font-heading font-bold text-accent">Rektor & Para Wakil Rektor</p>
                  <p className="text-[11px] text-white/80">Universitas Ibn Khaldun Bogor Masa Bakti 2024–2028</p>
                </div>
              </div>
            </div>

            {/* Pesan Amanah */}
            <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
                <ScrollText className="h-4 w-4 text-primary" />
                <span>Amanah & Komitmen Pimpinan</span>
              </div>

              <h2 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-ink leading-snug">
                Pendidikan Berkualitas untuk Seluruh Umat
              </h2>

              <p className="mt-4 rounded-2xl border-l-4 border-primary bg-primary-light/40 p-5 text-xs sm:text-sm leading-relaxed text-ink/90">
                {landing.pimpinan.pesan}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted border-t border-border pt-4">
                <span className="font-semibold text-primary">
                  Dasar Hukum: SK Rektor No. 796/KEP/UIKA/2026
                </span>
                <span>Bogor, Jawa Barat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Empat Pilar Tata Kelola Beasiswa */}
      <section id="pilar" className="py-16 bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Integritas & Tata Kelola</span>
            </span>
            <h2 className="mt-3 font-heading text-2xl sm:text-3xl font-bold text-ink">
              4 Pilar Utama Sistem Beasiswa
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Dirancang dengan tata kelola syariah dan akuntabilitas modern untuk menjamin keadilan bagi seluruh mahasiswa pemohon.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pilar 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-alt/40 p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xs">
                  <HeartHandshake className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-heading text-base font-bold text-ink">
                  {landing.pilar[0].judul}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {landing.pilar[0].deskripsi}
                </p>
              </div>
              <div className="mt-4 border-t border-border/60 pt-3 text-[11px] font-semibold text-primary">
                Pemerataan Bantuan
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-alt/40 p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-ink shadow-xs">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-heading text-base font-bold text-ink">
                  {landing.pilar[1].judul}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {landing.pilar[1].deskripsi}
                </p>
              </div>
              <div className="mt-4 border-t border-border/60 pt-3 text-[11px] font-semibold text-accent-dark">
                Bebas Subjektivitas
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-alt/40 p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xs">
                  <TrendingUp className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-heading text-base font-bold text-ink">
                  {landing.pilar[2].judul}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {landing.pilar[2].deskripsi}
                </p>
              </div>
              <div className="mt-4 border-t border-border/60 pt-3 text-[11px] font-semibold text-primary">
                Pembinaan Berkelanjutan
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-alt/40 p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-accent shadow-xs">
                  <FileCheck2 className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-heading text-base font-bold text-ink">
                  {landing.pilar[3].judul}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {landing.pilar[3].deskripsi}
                </p>
              </div>
              <div className="mt-4 border-t border-border/60 pt-3 text-[11px] font-semibold text-navy">
                Laporan Real-Time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Cerita Inspiratif & Rekening Resmi */}
      <section id="rekening" className="py-16 bg-gradient-to-br from-primary-light/60 via-surface to-accent/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Foto Cerita */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
                <Image
                  src={landing.gambar.ceritaFoto || "/images/beasiswa-keluarga-3.jpg"}
                  alt="Keluarga Bahagia Penerima Beasiswa UIKA"
                  width={700}
                  height={500}
                  className="w-full h-80 sm:h-96 object-cover"
                  unoptimized={Boolean(landing.gambar.ceritaFoto)}
                />
              </div>
            </div>

            {/* Rekening Resmi & Kontak */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase w-fit">
                <Landmark className="h-3.5 w-3.5" />
                <span>Saluran Donasi Resmi</span>
              </span>

              <h2 className="mt-3 font-heading text-2xl sm:text-3xl font-bold text-ink">
                Salurkan Kebaikan Anda Sekarang
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Setiap donasi Anda dikelola secara amanah dan disalurkan langsung untuk pembiayaan pendidikan mahasiswa UIKA Bogor.
              </p>

              {/* Card Nomor Rekening BSI */}
              <div className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] p-6 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/80">{landing.rekening.bank}</span>
                  <Image
                    src={logo}
                    alt="Logo UIKA"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                    unoptimized={Boolean(landing.gambar.logo)}
                  />
                </div>
                <p className="mt-3 font-mono text-2xl sm:text-3xl font-bold tracking-wider text-accent">
                  {landing.rekening.nomor}
                </p>
                <p className="mt-1 text-xs font-medium text-white/90">
                  a.n. {landing.rekening.atasNama}
                </p>

                {/* Quick CTA di dalam card rekening */}
                <div className="mt-5 border-t border-white/20 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <span className="text-white/80 text-[11px]">
                    Sudah transfer? Konfirmasi ke admin kami:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://wa.me/${keFormatWaMe(kontak1.nomor)}?text=${PESAN_WA_KONFIRMASI}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-500"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WA Kontak 1</span>
                    </a>
                    <a
                      href={`https://wa.me/${keFormatWaMe(kontak2.nomor)}?text=${PESAN_WA_KONFIRMASI}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-500"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WA Kontak 2</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Kontak Pengelola dengan Tombol Konfirmasi Lengkap */}
              <div className="mt-4 rounded-2xl border border-border bg-surface p-5 text-xs text-ink shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <p className="font-semibold text-primary flex items-center gap-1.5 text-xs sm:text-sm">
                    <PhoneCall className="h-4 w-4 text-primary" />
                    <span>Layanan Konfirmasi & Informasi Donasi:</span>
                  </p>
                  <span className="text-[11px] font-medium text-muted">Respon Cepat (WhatsApp)</span>
                </div>

                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Kontak 1: Nurseha Marasabessy */}
                  <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/40 p-3.5 transition-all hover:border-primary/50 hover:bg-surface">
                    <div>
                      <p className="font-bold text-ink text-xs sm:text-sm">{kontak1.nama}</p>
                      <p className="font-mono text-xs text-primary font-semibold mt-0.5">{kontak1.nomor}</p>
                    </div>
                    <div className="mt-3">
                      <a
                        href={`https://wa.me/${keFormatWaMe(kontak1.nomor)}?text=${PESAN_WA_KONFIRMASI}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.98]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Konfirmasi ke Kontak 1</span>
                      </a>
                    </div>
                  </div>

                  {/* Kontak 2 */}
                  <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-alt/40 p-3.5 transition-all hover:border-primary/50 hover:bg-surface">
                    <div>
                      <p className="font-bold text-ink text-xs sm:text-sm">{kontak2.nama}</p>
                      <p className="font-mono text-primary font-semibold text-xs mt-0.5">{kontak2.nomor}</p>
                    </div>
                    <div className="mt-3">
                      <a
                        href={`https://wa.me/${keFormatWaMe(kontak2.nomor)}?text=${PESAN_WA_KONFIRMASI}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.98]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Konfirmasi ke Kontak 2</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer Program */}
      <FooterProgram />
    </div>
  );
}
