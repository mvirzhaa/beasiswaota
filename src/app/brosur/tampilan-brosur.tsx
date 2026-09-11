"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  HeartHandshake,
  GraduationCap,
  ArrowLeft,
  Share2,
  Check,
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  PhoneCall,
  Mail,
  MapPin,
  Sparkles,
  ScrollText,
  Landmark,
  CheckCircle2,
  Download,
} from "lucide-react";
import { Tombol } from "@/components/ui/tombol";

type TipeBrosur = "donatur" | "mahasiswa";

export function TampilanBrosur() {
  const [tipeAktif, setTipeAktif] = useState<TipeBrosur>("donatur");
  const [sudahSalin, setSudahSalin] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSalinLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setSudahSalin(true);
      setTimeout(() => setSudahSalin(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-ink antialiased">
      {/* 1. TOP CONTROL BAR (Disembunyikan saat dicetak) */}
      <div className="print:hidden sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Tombol variant="garis" ukuran="sm" className="font-semibold text-xs">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Beranda</span>
              </Tombol>
            </Link>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex rounded-lg bg-surface-alt p-1 border border-border">
              <button
                type="button"
                onClick={() => setTipeAktif("donatur")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  tipeAktif === "donatur"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <HeartHandshake className="h-4 w-4" />
                <span>Brosur Donatur</span>
              </button>
              <button
                type="button"
                onClick={() => setTipeAktif("mahasiswa")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  tipeAktif === "mahasiswa"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Brosur Mahasiswa</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tombol
              variant="garis"
              ukuran="sm"
              onClick={handleSalinLink}
              className="text-xs font-semibold"
            >
              {sudahSalin ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Salin Link</span>
                </>
              )}
            </Tombol>

            <Tombol
              variant="primer"
              ukuran="sm"
              onClick={handlePrint}
              className="font-bold text-xs shadow-md bg-primary hover:bg-primary-dark"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Simpan PDF</span>
            </Tombol>
          </div>
        </div>
      </div>

      {/* 2. PETUNJUK RINGKAS CETAK (Layar Saja) */}
      <div className="print:hidden mx-auto max-w-4xl px-4 pt-4 text-center">
        <p className="text-xs text-muted">
          💡 <strong>Tips Cetak/PDF:</strong> Klik tombol{" "}
          <strong className="text-primary font-bold">Cetak / Simpan PDF</strong>, lalu pada dialog
          print pilih <em>Destination: Save as PDF</em> atau printer Anda dengan ukuran kertas{" "}
          <strong>A4</strong>.
        </p>
      </div>

      {/* 3. LEMBAR BROSUR (PRINTABLE SHEET) */}
      <main className="mx-auto max-w-4xl px-2 py-6 sm:px-4 print:p-0 print:m-0 print:max-w-none">
        {tipeAktif === "donatur" ? (
          <BrosurDonatur />
        ) : (
          <BrosurMahasiswa />
        )}
      </main>

      {/* CSS Khusus Print agar presisi A4 dan warna tajam */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: #19232b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

{/* ========================================================================= */}
{/* 1. KOMPONEN BROSUR DONATUR & ORANG TUA ASUH                                */}
{/* ========================================================================= */}
function BrosurDonatur() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl print:rounded-none print:border-none print:shadow-none">
      {/* Header Elegan */}
      <header className="relative bg-gradient-to-r from-primary-dark via-primary to-[#0e584f] p-6 text-white sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
              <Image
                src="/images/logo-uika.png"
                alt="Logo UIKA Bogor"
                width={50}
                height={50}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="block text-xs font-semibold tracking-wider uppercase text-accent">
                Program Filantropi Pendidikan
              </span>
              <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Universitas Ibn Khaldun Bogor
              </h1>
              <p className="text-xs text-white/80">
                Beasiswa Orangtua Asuh • SK Rektor No. 796/KEP/UIKA/2026
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent border border-accent/40">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Amal Jariyah Terpadu</span>
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-white/20 pt-4">
          <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl text-white">
            Menjembatani Asa, Mewujudkan Sarjana
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
            Menghimpun kedermawanan para donatur untuk membiayai Uang Kuliah Tunggal (UKT) mahasiswa
            berprestasi dan dhuafa, memastikan tidak ada generasi yang terhenti studinya.
          </p>
        </div>
      </header>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Cerita & Kutipan Hadits */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12 items-center">
          <div className="sm:col-span-7">
            <div className="rounded-xl border-l-4 border-primary bg-primary-light/40 p-4 text-xs text-ink/90 leading-relaxed">
              <p className="italic text-ink">
                &ldquo;Apabila manusia mati, terputuslah amalnya kecuali tiga perkara: sedekah
                jariyah, ilmu yang bermanfaat, dan anak saleh yang mendoakannya.&rdquo;
              </p>
              <p className="mt-1 font-bold text-primary text-right">— HR. Muslim</p>
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Setiap semester, puluhan mahasiswa berprestasi dari keluarga dhuafa dan anak yatim di
              UIKA Bogor berjuang keras mempertahankan kuliahnya. Bantuan Anda adalah jembatan nyata
              yang mengantarkan mereka menuju masa depan gemilang.
            </p>
          </div>

          <div className="sm:col-span-5">
            <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
              <Image
                src="/images/beasiswa-keluarga-1.jpg"
                alt="Dukungan Beasiswa UIKA"
                width={400}
                height={260}
                className="h-36 w-full object-cover sm:h-40"
              />
              <div className="bg-primary/90 p-2 text-center text-[11px] font-semibold text-white">
                Mendukung Masa Depan Generasi Qurani
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pilar Tata Kelola */}
        <div className="print-break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
              4 Keunggulan & Tata Kelola Sistem
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <HeartHandshake className="h-4 w-4 text-primary shrink-0" />
                <span>1. Dana Terpadu (Pooling)</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-normal">
                Donasi dihimpun kolektif per semester untuk menjamin pemerataan bantuan yang adil
                dan terukur bagi seluruh penerima manfaat.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent-dark shrink-0" />
                <span>2. Skoring Objektif & Matematis</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-normal">
                Seleksi berbasis algoritma penilaian status yatim/piatu, tanggungan, penghasilan,
                dan IPK bebas dari unsur subjektivitas.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <span>3. Monitoring Akademik Rutin</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-normal">
                Donatur dapat memantau capaian IPK dan laporan studi anak asuh secara berkala
                melalui portal digital.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <FileCheck2 className="h-4 w-4 text-navy shrink-0" />
                <span>4. Akuntabilitas & Real-Time</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-normal">
                Setiap rupiah tercatat dalam ledger keuangan resmi yang transparan dan dapat
                dipertanggungjawabkan dunia akhirat.
              </p>
            </div>
          </div>
        </div>

        {/* Pilihan Paket Donasi & Komitmen */}
        <div className="print-break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <ScrollText className="h-5 w-5 text-accent-dark" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink">
              Pilihan Komitmen Donasi
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-white p-3.5 shadow-xs text-center">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Infaq Fleksibel
              </span>
              <p className="mt-2 font-heading text-base font-bold text-ink">Rp 50rb – 200rb</p>
              <p className="text-[10px] text-muted">/ bulan (Dana Abadi UKT)</p>
            </div>

            <div className="rounded-xl border-2 border-accent bg-accent/5 p-3.5 shadow-xs text-center">
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold text-accent-dark">
                Orang Tua Asuh Penuh
              </span>
              <p className="mt-2 font-heading text-base font-bold text-ink">Rp 1,5 Jt – 3 Jt</p>
              <p className="text-[10px] text-muted">/ semester (1 Mahasiswa Asuh)</p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3.5 shadow-xs text-center">
              <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[10px] font-bold text-navy">
                Mitra Korporasi / Alumni
              </span>
              <p className="mt-2 font-heading text-base font-bold text-ink">Kemitraan Khusus</p>
              <p className="text-[10px] text-muted">Kuota beasiswa prodi tertentu</p>
            </div>
          </div>
        </div>

        {/* Kotak Rekening Resmi & QR Code Portal */}
        <div className="print-break-inside-avoid rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] p-5 text-white shadow-md">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Saluran Rekening Resmi Donasi
                </span>
              </div>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-white">
                7367215121
              </p>
              <p className="text-xs font-medium text-white/95">
                Bank Syariah Indonesia (BSI) • a.n. <strong>Orang Tua Asuh UIKA Bogor</strong>
              </p>
              <p className="mt-2 text-[11px] text-white/80">
                Pendaftaran Donatur & Laporan:{" "}
                <strong className="text-accent underline">beasiswaota.uika-bogor.ac.id</strong>
              </p>
            </div>

            <div className="sm:col-span-4 flex flex-col items-center justify-center rounded-xl bg-white p-3 text-ink shadow-sm">
              <VectorQRCode url="https://beasiswaota.uika-bogor.ac.id" size={80} />
              <span className="mt-1.5 text-[10px] font-bold text-primary text-center">
                Scan untuk Buka Portal
              </span>
            </div>
          </div>
        </div>

        {/* Footer Kontak & Alamat Kampus */}
        <footer className="border-t border-border pt-4 text-[11px] text-muted flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Gedung Rektorat UIKA Bogor, Jl. KH. Sholeh Iskandar, Kota Bogor</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 font-medium text-ink">
              <PhoneCall className="h-3.5 w-3.5 text-primary" />
              <span>WA: 0813-8315-5797 / 0818-0714-6988</span>
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>beasiswaota@uika-bogor.ac.id</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* 2. KOMPONEN BROSUR MAHASISWA (SOSIALISASI PENDAFTARAN)                     */}
{/* ========================================================================= */}
function BrosurMahasiswa() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl print:rounded-none print:border-none print:shadow-none">
      {/* Header Mahasiswa */}
      <header className="relative bg-gradient-to-r from-primary-dark via-primary to-[#0e584f] p-6 text-white sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
              <Image
                src="/images/logo-uika.png"
                alt="Logo UIKA Bogor"
                width={50}
                height={50}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className="block text-xs font-semibold tracking-wider uppercase text-accent">
                Biro Kemahasiswaan UIKA Bogor
              </span>
              <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Pendaftaran Beasiswa Orangtua Asuh
              </h1>
              <p className="text-xs text-white/80">
                Bantuan Uang Kuliah Tunggal (UKT) Mahasiswa Berprestasi & Dhuafa
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-ink">
              <GraduationCap className="h-4 w-4" />
              <span>Pendaftaran Online</span>
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-white/20 pt-4">
          <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl text-white">
            Raih Mimpimu Menjadi Sarjana!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
            Universitas Ibn Khaldun Bogor membuka kesempatan beasiswa bantuan biaya kuliah bagi
            mahasiswa aktif yang berprestasi dan berlatar belakang keluarga dhuafa / yatim / piatu.
          </p>
        </div>
      </header>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Persyaratan & Kriteria */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
          {/* Kolom Kiri: Syarat */}
          <div className="sm:col-span-7 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
                Kriteria & Persyaratan Pendaftar
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs text-ink/90">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Mahasiswa aktif Program Sarjana (S1) UIKA Bogor (minimal semester 2 aktif).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Memiliki Indeks Prestasi Kumulatif (IPK) terakhir minimal <strong>3.00</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Berasal dari keluarga dhuafa / berstatus <strong>Yatim / Piatu</strong> / kendala
                  finansial mendesak.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>Tidak sedang menerima beasiswa penuh dari pihak / instansi lain.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>Berkelakuan baik dan berkomitmen aktif dalam kegiatan pembinaan kampus.</span>
              </li>
            </ul>
          </div>

          {/* Kolom Kanan: Berkas */}
          <div className="sm:col-span-5">
            <div className="rounded-xl border border-border bg-surface-alt/60 p-4">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-accent-dark" />
                <span>Berkas yang Disiapkan</span>
              </h4>
              <ul className="mt-3 space-y-2 text-[11px] text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Scan Kartu Tanda Mahasiswa (KTM) & KTP</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Scan Kartu Keluarga (KK)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Transkrip Nilai / KHS semester terakhir</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Surat Keterangan Tidak Mampu (SKTM) / Slip Gaji</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Foto formal dan dokumen pendukung</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4 Tahap Pendaftaran Online */}
        <div className="print-break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <TrendingUp className="h-5 w-5 text-accent-dark" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink">
              4 Langkah Mudah Pendaftaran di Portal
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                1
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Buat Akun</p>
              <p className="text-[10px] text-muted mt-1">
                Buka website & daftar menggunakan NIM aktif Anda.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                2
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Isi Formulir</p>
              <p className="text-[10px] text-muted mt-1">
                Lengkapi data ekonomi keluarga, tanggungan, dan nilai akademik.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                3
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Unggah Berkas</p>
              <p className="text-[10px] text-muted mt-1">
                Upload berkas persyaratan format PDF/JPG maksimal 5MB.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-ink text-xs font-bold">
                4
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Pantau Status</p>
              <p className="text-[10px] text-muted mt-1">
                Cek hasil skoring & pengumuman lolos via dashboard akun Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Banner Ajakan Daftar & QR Code */}
        <div className="print-break-inside-avoid rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] p-5 text-white shadow-md">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-accent">
                Pendaftaran Paperless & 100% Online
              </span>
              <h4 className="mt-2 font-heading text-xl font-bold text-white">
                Daftar Sekarang Sebelum Periode Ditutup!
              </h4>
              <p className="mt-1 text-xs text-white/85">
                Kunjungi:{" "}
                <strong className="text-accent underline">
                  beasiswaota.uika-bogor.ac.id/register
                </strong>
              </p>
              <p className="mt-2 text-[11px] text-white/70">
                Pusat Bantuan & Layanan Mahasiswa: Biro Kemahasiswaan UIKA Bogor
              </p>
            </div>

            <div className="sm:col-span-4 flex flex-col items-center justify-center rounded-xl bg-white p-3 text-ink shadow-sm">
              <VectorQRCode
                url="https://beasiswaota.uika-bogor.ac.id/register?peran=MAHASISWA"
                size={80}
              />
              <span className="mt-1.5 text-[10px] font-bold text-primary text-center">
                Scan Daftar Mahasiswa
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-4 text-[11px] text-muted flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Biro Kemahasiswaan UIKA Bogor, Jl. KH. Sholeh Iskandar, Kota Bogor</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 font-medium text-ink">
              <PhoneCall className="h-3.5 w-3.5 text-primary" />
              <span>WA Layanan: 0813-8315-5797 / 0818-0714-6988</span>
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>beasiswaota@uika-bogor.ac.id</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

{/* ========================================================================= */}
{/* VECTOR QR CODE SVG (Renders instantly without network/packages)           */}
{/* ========================================================================= */}
function VectorQRCode({ url, size = 80 }: { url: string; size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center bg-white p-1 rounded-md border border-slate-200"
      style={{ width: size, height: size }}
      title={url}
    >
      <svg
        viewBox="0 0 29 29"
        className="w-full h-full text-ink"
        fill="currentColor"
        shapeRendering="crispEdges"
      >
        {/* Top-Left Finder */}
        <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
        {/* Top-Right Finder */}
        <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
        {/* Bottom-Left Finder */}
        <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />
        {/* Timing Pattern & Data Blocks */}
        <path d="M8,1 h2 v1 h-2 z M12,1 h3 v1 h-3 z M17,1 h1 v1 h-1 z M19,1 h2 v1 h-2 z" />
        <path d="M9,3 h1 v2 h-1 z M12,3 h1 v1 h-1 z M15,3 h2 v1 h-2 z M19,3 h1 v2 h-1 z" />
        <path d="M8,6 h2 v1 h-2 z M13,6 h1 v1 h-1 z M16,6 h2 v1 h-2 z M20,6 h1 v1 h-1 z" />
        <path d="M6,8 h1 v1 h-1 z M8,8 h3 v1 h-3 z M13,8 h2 v1 h-2 z M17,8 h1 v1 h-1 z M20,8 h3 v1 h-3 z" />
        <path d="M0,9 h1 v2 h-1 z M3,9 h2 v1 h-2 z M8,9 h1 v1 h-1 z M11,9 h2 v1 h-2 z M15,9 h3 v1 h-3 z M20,9 h1 v1 h-1 z M24,9 h2 v1 h-2 z" />
        <path d="M1,12 h2 v1 h-2 z M5,12 h1 v1 h-1 z M8,12 h2 v1 h-2 z M12,12 h5 v5 h-5 z M19,12 h2 v1 h-2 z M23,12 h1 v1 h-1 z M26,12 h2 v1 h-2 z" />
        <path d="M0,14 h3 v1 h-3 z M5,14 h2 v1 h-2 z M9,14 h1 v1 h-1 z M19,14 h1 v1 h-1 z M22,14 h3 v1 h-3 z M27,14 h1 v1 h-1 z" />
        <path d="M2,16 h1 v1 h-1 z M5,16 h1 v1 h-1 z M8,16 h3 v1 h-3 z M18,16 h2 v1 h-2 z M22,16 h1 v1 h-1 z M25,16 h2 v1 h-2 z" />
        <path d="M0,18 h2 v1 h-2 z M4,18 h2 v1 h-2 z M8,18 h1 v1 h-1 z M11,18 h2 v1 h-2 z M15,18 h1 v1 h-1 z M18,18 h3 v1 h-3 z M23,18 h2 v1 h-2 z" />
        <path d="M8,20 h2 v1 h-2 z M12,20 h1 v1 h-1 z M15,20 h2 v1 h-2 z M19,20 h2 v1 h-2 z M23,20 h1 v1 h-1 z M26,20 h2 v1 h-2 z" />
        <path d="M9,22 h1 v1 h-1 z M12,22 h2 v1 h-2 z M16,22 h1 v1 h-1 z M19,22 h3 v1 h-3 z M24,22 h2 v1 h-2 z M27,22 h1 v1 h-1 z" />
        <path d="M8,24 h3 v1 h-3 z M13,24 h1 v1 h-1 z M16,24 h2 v1 h-2 z M20,24 h1 v1 h-1 z M23,24 h3 v1 h-3 z" />
        <path d="M9,26 h2 v1 h-2 z M13,26 h2 v1 h-2 z M17,26 h1 v1 h-1 z M20,26 h2 v1 h-2 z M24,26 h1 v1 h-1 z M27,26 h1 v1 h-1 z" />
        <path d="M8,28 h1 v1 h-1 z M11,28 h3 v1 h-3 z M16,28 h1 v1 h-1 z M19,28 h2 v1 h-2 z M23,28 h4 v1 h-4 z" />
      </svg>
    </div>
  );
}
