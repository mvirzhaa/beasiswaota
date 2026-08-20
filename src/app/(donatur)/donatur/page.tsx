import Image from "next/image";
import Link from "next/link";
import {
  HandCoins,
  Wallet,
  Users,
  ClipboardList,
  MessageCircle,
  HeartHandshake,
  ShieldCheck,
  Award,
  ArrowRight,
  Sparkles,
  ScrollText,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Tombol } from "@/components/ui/tombol";

export default async function DashboardDonatur() {
  const session = await auth();

  return (
    <main className="mx-auto mt-6 mb-16 max-w-6xl px-4 sm:px-6">
      {/* 1. Visual Split Hero: Banner Utama & Cerita Beasiswa */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] text-white shadow-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="grid grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-accent uppercase backdrop-blur-xs">
              <Image
                src="/images/logo-uika.png"
                alt="Logo UIKA"
                width={18}
                height={18}
                className="h-4.5 w-4.5 object-contain"
              />
              <span>Universitas Ibn Khaldun Bogor</span>
            </div>

            <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-white sm:text-4xl lg:leading-tight">
              Selamat Datang, Orang Tua Asuh
            </h1>

            <p className="mt-2 text-sm sm:text-base text-white/90 leading-relaxed max-w-xl">
              Terima kasih atas keikhlasan dan komitmen Anda menjadi jembatan asa bagi mahasiswa UIKA. Setiap rupiah donasi Anda disalurkan secara amanah untuk membiayai studi generasi penerus.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/donatur/komitmen">
                <Tombol variant="aksen" ukuran="md" className="font-bold shadow-md">
                  <HandCoins className="h-4 w-4" />
                  <span>Buat Komitmen Baru</span>
                </Tombol>
              </Link>
              <Link href="/donatur/pembayaran">
                <Tombol variant="garis" ukuran="md" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Wallet className="h-4 w-4" />
                  <span>Jadwal & Pembayaran</span>
                </Tombol>
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-3 text-xs text-white/75 border-t border-white/15 pt-4">
              <span className="font-medium">Akun Masuk:</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-accent">
                {session?.user?.email ?? "Donatur UIKA"}
              </span>
            </div>
          </div>

          {/* Foto Cerita Beasiswa */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src="/images/beasiswa-keluarga-1.jpg"
                alt="Orang Tua Asuh Mendukung Mimpi Meraih Masa Depan"
                width={600}
                height={400}
                className="h-64 sm:h-72 w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/40 p-3 backdrop-blur-xs text-xs text-white/95 border border-white/10">
                <p className="font-semibold text-accent flex items-center gap-1">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  <span>Mendukung Mimpi, Meraih Masa Depan</span>
                </p>
                <p className="mt-0.5 text-[11px] text-white/80">
                  Bantuan pendidikan yang membuka jalan kesuksesan mahasiswa dan keluarga.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pilar Integritas & Tata Kelola Sistem (3 Pilar Infografis) */}
      <section className="mt-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold text-ink">Dana Terpadu (Pooling)</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Seluruh dana dihimpun dalam pool per periode untuk pemerataan kesempatan dan menjangkau lebih banyak mahasiswa.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold text-ink">Skoring Objektif</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Mesin alokasi menyalurkan dana berdasarkan bobot kebutuhan finansial, status yatim/dhuafa, dan kelayakan akademik.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold text-ink">Monitoring Berkelanjutan</h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Perkembangan IPK dan laporan semester mahasiswa dipantau secara berkala sebagai syarat perpanjangan beasiswa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Amanah & Kepemimpinan UIKA (Section Pimpinan) */}
      <section className="mt-12 overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
        <div className="grid grid-cols-1 items-center lg:grid-cols-12">
          {/* Foto Pimpinan */}
          <div className="relative lg:col-span-5 bg-surface-alt/50 p-4 sm:p-6 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-border">
            <div className="relative overflow-hidden rounded-2xl shadow-md border border-border bg-white">
              <Image
                src="/images/pimpinan-uika.jpg"
                alt="Pimpinan Universitas Ibn Khaldun Bogor 2024-2028"
                width={700}
                height={500}
                className="w-full h-auto object-cover"
              />
              <div className="bg-navy p-3 text-center text-xs text-white">
                <p className="font-heading font-bold text-accent">Rektor & Para Wakil Rektor</p>
                <p className="text-[11px] text-white/80">Universitas Ibn Khaldun Bogor Masa Bakti 2024–2028</p>
              </div>
            </div>
          </div>

          {/* Pernyataan Amanah Rektor */}
          <div className="p-6 sm:p-8 lg:col-span-7 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
              <ScrollText className="h-4 w-4 text-primary" />
              <span>Dasar Hukum & Amanah Rektor</span>
            </div>

            <h2 className="mt-2 font-heading text-xl sm:text-2xl font-bold text-ink leading-snug">
              Komitmen Institusi untuk Pendidikan Berkelanjutan
            </h2>

            <blockquote className="mt-3 rounded-2xl border-l-4 border-primary bg-primary-light/40 p-4 text-xs sm:text-sm italic leading-relaxed text-ink/90">
              &ldquo;Program Beasiswa Orangtua Asuh adalah wujud nyata kepedulian sivitas akademika dan para munfiq untuk memastikan tidak ada mahasiswa berprestasi dan dhuafa di UIKA yang terhenti cita-citanya karena keterbatasan finansial.&rdquo;
            </blockquote>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted border-t border-border pt-3">
              <span className="font-semibold text-primary">
                SK Rektor No. 796/KEP/UIKA/2026
              </span>
              <span>Universitas Ibn Khaldun Bogor</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pusat Layanan & Navigasi Modul Donatur */}
      <section className="mt-14">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">
              Pusat Layanan Orang Tua Asuh
            </h2>
            <p className="text-xs text-muted">Akses cepat seluruh fitur pengelolaan donasi dan komunikasi</p>
          </div>
          <span className="text-xs font-medium text-accent-dark">5 Modul Layanan</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Modul 1: Komitmen Donasi */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                  <HandCoins className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Tahap 1
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Komitmen Donasi
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Tentukan skema bantuan penuh/parsial, jangka waktu semester, dan mekanisme pembayaran (transfer/potong gaji).
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/donatur/komitmen"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Kelola Komitmen</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 2: Jadwal & Pembayaran */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark transition-colors group-hover:bg-accent group-hover:text-ink shadow-xs">
                  <Wallet className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Tahap 2
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Jadwal & Pembayaran
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Pantau tanggal jatuh tempo per semester, bayar instan via Midtrans/VA, atau unggah bukti transfer rekening resmi UIKA.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/donatur/pembayaran"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Buka Pembayaran</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 3: Mahasiswa Binaan */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                  <Users className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Monitoring
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Mahasiswa Binaan
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Pantau grafik perkembangan IPK antar semester dan baca laporan berkala dari mahasiswa yang Anda dampingi.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/donatur/binaan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Lihat Mahasiswa Binaan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 4: Laporan Penyaluran */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                  <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Transparansi
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Laporan Penyaluran
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Dapatkan rincian akuntabel ke mana saja rupiah donasi Anda dialokasikan kepada mahasiswa di berbagai fakultas.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/donatur/laporan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Lihat Laporan Penyaluran</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 5: Pesan & Silaturahmi */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md md:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark transition-colors group-hover:bg-accent group-hover:text-ink shadow-xs">
                  <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
                  Komunikasi Terarah
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Pesan & Silaturahmi Binaan
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted max-w-xl">
                Kirimkan pesan motivasi, nasihat, dan bimbingan moral kepada mahasiswa binaan melalui sistem moderasi terpadu pengelola program.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/donatur/pesan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Buka Pesan Binaan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cerita Inspiratif & Harapan Mahasiswa */}
      <section className="mt-14 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-light/60 via-surface to-accent/10 p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Harapan & Perjuangan</span>
            </span>

            <h2 className="mt-3 font-heading text-2xl font-bold text-ink sm:text-3xl leading-tight">
              Membuka Pintu Cita-Cita Mahasiswa UIKA
            </h2>

            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted">
              Di balik setiap pengajuan beasiswa, ada doa orang tua dan kerja keras mahasiswa yang pantang menyerah. Terima kasih telah menjadi bagian dari perjalanan meraih masa depan gemilang bersama Universitas Ibn Khaldun Bogor.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-xs text-ink/90">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Meringankan beban biaya Uang Kuliah Tunggal (UKT) mahasiswa</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Mendorong peningkatan prestasi akademik dan pembinaan akhlak</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Membangun ekosistem tolong-menolong (*ta&apos;awun*) yang berkelanjutan</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
              <Image
                src="/images/beasiswa-keluarga-3.jpg"
                alt="Mahasiswa dan Keluarga Meraih Impian Beasiswa UIKA"
                width={650}
                height={450}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
