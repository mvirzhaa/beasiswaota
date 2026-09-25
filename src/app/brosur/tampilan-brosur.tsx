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
  Scale,
  Calendar,
  Building2,
  BadgeCheck,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Tombol } from "@/components/ui/tombol";
import type { PengaturanLanding } from "@/lib/pengaturan-landing/schema";
import { DEFAULT_PENGATURAN_LANDING } from "@/server/queries/pengaturan-landing";

type TipeBrosur = "donatur" | "mahasiswa";

interface TampilanBrosurProps {
  landing?: PengaturanLanding;
}

export function TampilanBrosur({ landing = DEFAULT_PENGATURAN_LANDING }: TampilanBrosurProps) {
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
                <span>Brosur Donatur / Munfiq</span>
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
                <span>Brosur Mahasiswa / Penerima</span>
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
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-ink/80 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-left">
            💡 <strong>Panduan Cetak / Unduh PDF:</strong> Pilih brosur yang ingin dicetak di atas, klik{" "}
            <strong className="text-primary font-bold">Cetak / Simpan PDF</strong>, lalu atur opsi printer ke ukuran kertas{" "}
            <strong>A4</strong> dengan margin minimum.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            {tipeAktif === "donatur" ? (
              <Link href="/register" className="inline-flex items-center gap-1 hover:underline">
                <span>Buka Formulir Donatur</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <a href="#alur-pendaftaran" className="inline-flex items-center gap-1 hover:underline">
                <span>Lihat Alur Berkas</span>
                <ArrowLeft className="h-3 w-3 rotate-270" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. LEMBAR BROSUR (PRINTABLE SHEET) */}
      <main className="mx-auto max-w-4xl px-2 py-6 sm:px-4 print:p-0 print:m-0 print:max-w-none">
        {tipeAktif === "donatur" ? (
          <BrosurDonatur landing={landing} />
        ) : (
          <BrosurMahasiswa landing={landing} />
        )}
      </main>

      {/* CSS Khusus Print agar presisi A4 dan warna tajam */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
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
          header, footer, section {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

{/* ========================================================================= */}
{/* 1. KOMPONEN BROSUR DONATUR & ORANG TUA ASUH                                */}
{/* ========================================================================= */}
function BrosurDonatur({ landing }: { landing: PengaturanLanding }) {
  const logo = landing.gambar.logo || "/images/logo-uika.png";
  const heroFoto = landing.gambar.ceritaFoto || landing.gambar.heroFoto || "/images/beasiswa-keluarga-1.jpg";
  const kontak1 = landing.kontak[0] || { nama: "Nurseha Marasabessy, S.H.", nomor: "0813-8315-5797" };
  const kontak2 = landing.kontak[1] || { nama: "Siti Nuraziyah, S.Ak.", nomor: "0818-0714-6988" };
  const rekening = landing.rekening;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl print:rounded-none print:border-none print:shadow-none">
      {/* Header Elegan */}
      <header className="relative bg-gradient-to-r from-primary-dark via-primary to-[#0e584f] p-6 text-white sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
              <Image
                src={logo}
                alt="Logo UIKA Bogor"
                width={50}
                height={50}
                className="h-full w-full object-contain"
                unoptimized={Boolean(landing.gambar.logo)}
              />
            </div>
            <div>
              <span className="block text-[11px] font-semibold tracking-wider uppercase text-accent">
                Program Filantropi Pendidikan Tinggi Islami
              </span>
              <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Universitas Ibn Khaldun Bogor
              </h1>
              <p className="text-xs text-white/80">
                Beasiswa Orang Tua Asuh • SK Rektor No. 796/KEP/UIKA/2026
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent border border-accent/40">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Amal Jariyah Berkelanjutan</span>
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-white/20 pt-4">
          <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl text-white">
            {landing.hero.judul || "Menjembatani Asa, Mewujudkan Sarjana"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
            {landing.hero.deskripsi ||
              "Menghimpun kedermawanan para donatur untuk membiayai Uang Kuliah Tunggal (UKT) mahasiswa berprestasi dan dhuafa, memastikan tidak ada generasi yang terhenti studinya."}
          </p>
        </div>
      </header>

      <div className="p-6 sm:p-8 space-y-5">
        {/* Cerita & Kutipan Hadits */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-12 items-center">
          <div className="sm:col-span-7">
            <div className="rounded-xl border-l-4 border-primary bg-primary-light/40 p-3.5 text-xs text-ink/90 leading-relaxed">
              <p className="italic text-ink font-medium">
                &ldquo;Apabila manusia telah meninggal dunia, maka terputuslah seluruh amalnya kecuali tiga perkara: sedekah jariyah, ilmu yang bermanfaat, dan anak saleh yang selalu mendoakannya.&rdquo;
              </p>
              <p className="mt-1 font-bold text-primary text-right">— HR. Muslim No. 1631</p>
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Setiap semester, puluhan mahasiswa berprestasi dari keluarga dhuafa, anak yatim, dan keluarga terdampak ekonomi mendesak di UIKA Bogor berjuang mempertahankan kuliahnya. Bantuan Anda adalah jembatan nyata yang menghantarkan mereka menyelesaikan studi dan meraih gelar sarjana.
            </p>
          </div>

          <div className="sm:col-span-5">
            <div className="relative overflow-hidden rounded-xl border border-border shadow-xs">
              <Image
                src={heroFoto}
                alt="Dukungan Beasiswa UIKA"
                width={400}
                height={260}
                className="h-32 w-full object-cover sm:h-36"
                unoptimized={Boolean(landing.gambar.ceritaFoto || landing.gambar.heroFoto)}
              />
              <div className="bg-primary/95 p-1.5 text-center text-[10px] font-semibold text-white">
                Membantu Mahasiswa Berprestasi & Dhuafa Menyelesaikan Sarjana
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pilar Tata Kelola Sistem (Real Sesuai Sistem Beasiswa OTA) */}
        <div className="print-break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
              4 Pilar Tata Kelola & Keunggulan Sistem
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <HeartHandshake className="h-4 w-4 text-primary shrink-0" />
                <span>1. Model Dana Terpadu (Pooling)</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Donasi dihimpun secara kolektif per periode semester. Bantuan dialokasikan secara adil dan merata sehingga satu donasi dapat membantu beberapa mahasiswa, dan satu mahasiswa dapat didanai gabungan para munfiq.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <Scale className="h-4 w-4 text-accent-dark shrink-0" />
                <span>2. Skoring Objektif & Matematis</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Seleksi berbasis algoritma terukur dengan 5 bobot kriteria: Penghasilan Orang Tua (35%), Status Yatim/Piatu (25%), Tanggungan Keluarga (20%), Prestasi IPK (15%), dan Semester Berjalan (5%).
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <span>3. Monitoring & Pendampingan Rutin</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Penerima manfaat mendapatkan pendampingan relasi asuh berkala. Mahasiswa wajib menyerahkan Laporan Perkembangan Studi (IPK & KHS) tiap semester sebagai syarat evaluasi beasiswa.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-alt/50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <FileCheck2 className="h-4 w-4 text-navy shrink-0" />
                <span>4. Akuntabilitas Real-Time (Ledger)</span>
              </div>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                Tiap rupiah donasi tercatat rapi di pembukuan (*double-entry ledger*). Donatur mendapatkan akses portal pribadi untuk memantau bukti transaksi dan daftar mahasiswa binaan secara transparan.
              </p>
            </div>
          </div>
        </div>

        {/* Pilihan Paket Donasi & Skema Fleksibel */}
        <div className="print-break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <ScrollText className="h-5 w-5 text-accent-dark" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink">
              Pilihan Skema Komitmen Kedermawanan
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-white p-3 text-center shadow-xs">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                Infaq Fleksibel
              </span>
              <p className="mt-1.5 font-heading text-sm font-bold text-ink">Rp 50rb – 200rb</p>
              <p className="text-[10px] text-muted mt-0.5">/ bulan (Dana Pool Beasiswa)</p>
              <p className="mt-1.5 text-[9.5px] text-muted/90">
                Pilihan tepat untuk sedekah rutin tanpa batas minimal
              </p>
            </div>

            <div className="rounded-xl border-2 border-accent bg-accent/5 p-3 text-center shadow-xs">
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent-dark">
                Orang Tua Asuh Penuh
              </span>
              <p className="mt-1.5 font-heading text-sm font-bold text-ink">Rp 2,5 Jt – 4,5 Jt</p>
              <p className="text-[10px] text-muted mt-0.5">/ semester (1 Mahasiswa)</p>
              <p className="mt-1.5 text-[9.5px] text-muted/90">
                Membiayai penuh UKT 1 mahasiswa asuh (1 s.d 8 semester)
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 text-center shadow-xs">
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold">
                Khusus Dosen / Tendik
              </span>
              <p className="mt-1.5 font-heading text-sm font-bold text-ink">Potong Gaji</p>
              <p className="text-[10px] text-muted mt-0.5">Autodebet Payroll UIKA</p>
              <p className="mt-1.5 text-[9.5px] text-muted/90">
                Mekanisme praktis bulanan langsung melalui bagian SDM/Keuangan
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 text-center shadow-xs">
              <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[9px] font-bold text-navy">
                Lembaga & Alumni
              </span>
              <p className="mt-1.5 font-heading text-sm font-bold text-ink">Kemitraan Khusus</p>
              <p className="text-[10px] text-muted mt-0.5">CSR / Kuota Prodi</p>
              <p className="mt-1.5 text-[9.5px] text-muted/90">
                Penyaluran beasiswa korporasi/paguyuban ke fakultas tertentu
              </p>
            </div>
          </div>
        </div>

        {/* Alur Menjadi Donatur */}
        <div className="print-break-inside-avoid rounded-xl border border-border bg-surface-alt/40 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-ink">
              Alur Mudah Berdonasi di Portal Sistem
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                1
              </span>
              <div>
                <p className="font-bold text-ink">Isi Formulir</p>
                <p className="text-[10px] text-muted">Kunjungi website & isi komitmen donasi perorangan/lembaga.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                2
              </span>
              <div>
                <p className="font-bold text-ink">Pilih Penyaluran</p>
                <p className="text-[10px] text-muted">Transfer Bank BSI, Virtual Account otomatis, atau Potong Gaji.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                3
              </span>
              <div>
                <p className="font-bold text-ink">Verifikasi Resmi</p>
                <p className="text-[10px] text-muted">Admin mengonfirmasi transaksi dan menerbitkan tanda terima sah.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                4
              </span>
              <div>
                <p className="font-bold text-ink">Akses Portal Pribadi</p>
                <p className="text-[10px] text-muted">Pantau jadwal, realisasi bantuan UKT, & laporan perkembangan binaan.</p>
              </div>
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
                  Saluran Rekening Resmi Donasi UIKA
                </span>
              </div>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-white">
                {rekening.nomor || "7367215121"}
              </p>
              <p className="text-xs font-medium text-white/95">
                {rekening.bank || "Bank Syariah Indonesia (BSI)"} • a.n. <strong>{rekening.atasNama || "Orang Tua Asuh UIKA Bogor"}</strong>
              </p>
              <p className="mt-2 text-[11px] text-white/85">
                Pendaftaran Donatur Online:{" "}
                <strong className="text-accent underline">beasiswaota.uika-bogor.ac.id/register</strong>
              </p>
              <p className="text-[10.5px] text-white/70 mt-0.5">
                *Donatur dapat memilih atas nama pribadi, almarhum keluarga, paguyuban, atau anonim (Hamba Allah).
              </p>
            </div>

            <div className="sm:col-span-4 flex flex-col items-center justify-center rounded-xl bg-white p-3 text-ink shadow-sm">
              <VectorQRCode url="https://beasiswaota.uika-bogor.ac.id/register" size={82} />
              <span className="mt-1.5 text-[10px] font-bold text-primary text-center">
                Scan Formulir Donatur
              </span>
            </div>
          </div>
        </div>

        {/* Footer Kontak & Alamat Kampus */}
        <footer className="border-t border-border pt-3.5 text-[11px] text-muted flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Gedung Rektorat UIKA Bogor Lt. 1, Jl. KH. Sholeh Iskandar, Kota Bogor</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-ink">
              <PhoneCall className="h-3.5 w-3.5 text-primary" />
              <span>{kontak1.nama}: {kontak1.nomor}</span>
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1 font-medium text-ink">
              <span>{kontak2.nama}: {kontak2.nomor}</span>
            </span>
            <span className="hidden sm:inline text-border">|</span>
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
{/* 2. KOMPONEN BROSUR MAHASISWA (SOSIALISASI & PERSYARATAN PENGAJUAN)        */}
{/* ========================================================================= */}
function BrosurMahasiswa({ landing }: { landing: PengaturanLanding }) {
  const logo = landing.gambar.logo || "/images/logo-uika.png";
  const kontak1 = landing.kontak[0] || { nama: "Nurseha Marasabessy, S.H.", nomor: "0813-8315-5797" };
  const kontak2 = landing.kontak[1] || { nama: "Siti Nuraziyah, S.Ak.", nomor: "0818-0714-6988" };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xl print:rounded-none print:border-none print:shadow-none">
      {/* Header Mahasiswa */}
      <header className="relative bg-gradient-to-r from-primary-dark via-primary to-[#0e584f] p-6 text-white sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
              <Image
                src={logo}
                alt="Logo UIKA Bogor"
                width={50}
                height={50}
                className="h-full w-full object-contain"
                unoptimized={Boolean(landing.gambar.logo)}
              />
            </div>
            <div>
              <span className="block text-[11px] font-semibold tracking-wider uppercase text-accent">
                Biro Kemahasiswaan & Bimbingan Konseling UIKA Bogor
              </span>
              <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Beasiswa Bantuan UKT Orang Tua Asuh
              </h1>
              <p className="text-xs text-white/80">
                Bagi Mahasiswa Aktif Berprestasi & Berlatar Belakang Dhuafa / Yatim
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-ink">
              <GraduationCap className="h-4 w-4" />
              <span>SK Rektor No. 796/2026</span>
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-white/20 pt-4">
          <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl text-white">
            Wujudkan Cita-Cita Menjadi Sarjana Berkarakter Islami
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
            Universitas Ibn Khaldun Bogor melalui komitmen para donatur dan orang tua asuh membuka kesempatan beasiswa bantuan pembiayaan Uang Kuliah Tunggal (UKT) bagi mahasiswa aktif yang mengalami kendala finansial mendesak.
          </p>
        </div>
      </header>

      <div className="p-6 sm:p-8 space-y-5">
        {/* Kriteria & Persyaratan Umum */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
          {/* Kolom Kiri: Syarat */}
          <div className="sm:col-span-7 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
                Kriteria & Persyaratan Calon Penerima
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-ink/90">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Mahasiswa aktif Program Sarjana (S1) UIKA Bogor (minimal semester 2 aktif atau jalur khusus rekomendasi).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Memiliki Indeks Prestasi Kumulatif (IPK) terakhir minimal <strong>3.00</strong> (skala 4.00).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Berasal dari keluarga dhuafa berpenghasilan rendah / berstatus <strong>Yatim, Piatu, atau Yatim-Piatu</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Memiliki tanggungan keluarga yang membutuhkan subsidi dan pertolongan biaya kuliah mendesak.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  <strong>Tidak sedang menerima beasiswa penuh</strong> dari pemerintah (KIP-K) atau instansi/lembaga lain.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-[10px]">
                  ✓
                </span>
                <span>
                  Berkelakuan baik dan bersedia aktif dalam pembinaan karakter serta menyerahkan Laporan Perkembangan Studi semesteran.
                </span>
              </li>
            </ul>
          </div>

          {/* Kolom Kanan: Berkas Wajib */}
          <div className="sm:col-span-5">
            <div className="rounded-xl border border-border bg-surface-alt/70 p-3.5">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5 border-b border-border/60 pb-2">
                <FileCheck2 className="h-4 w-4 text-accent-dark" />
                <span>Dokumen / Berkas Pengajuan</span>
              </h4>
              <ul className="mt-2.5 space-y-2 text-[11px] text-muted">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Scan Kartu Tanda Mahasiswa (KTM) & KTP Elektronik</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Scan Kartu Keluarga (KK) & KTP Orang Tua/Wali</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Transkrip Nilai / Kartu Hasil Studi (KHS) terakhir disahkan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Surat Keterangan Tidak Mampu (SKTM) dari Kelurahan/Desa ATAU Slip Gaji Orang Tua</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Foto kondisi tempat tinggal/rumah (tampak depan & dalam)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Rincian Tagihan UKT semester berjalan dari Bag. Keuangan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Surat Pernyataan Mahasiswa (format resmi UIKA)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 5 Kriteria Penilaian Skoring Sistem (Transparansi Objektif) */}
        <div className="print-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-accent-dark" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink">
                5 Bobot Penilaian Sistem Skoring SIMOTA
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-primary hidden sm:inline">
              100% Objektif & Bebas Subjektivitas
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
            <div className="rounded-xl border border-border bg-white p-2.5 shadow-xs text-center">
              <span className="text-base font-bold text-primary">35%</span>
              <p className="mt-1 text-xs font-bold text-ink leading-tight">Penghasilan Ortu</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Prioritas bagi pendapatan di bawah rata-rata / ekonomi rendah
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-2.5 shadow-xs text-center">
              <span className="text-base font-bold text-accent-dark">25%</span>
              <p className="mt-1 text-xs font-bold text-ink leading-tight">Status Ortu</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Yatim Piatu (skor tertinggi), Yatim / Piatu, atau Lengkap
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-2.5 shadow-xs text-center">
              <span className="text-base font-bold text-emerald-700">20%</span>
              <p className="mt-1 text-xs font-bold text-ink leading-tight">Tanggungan</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Jumlah anggota keluarga yang masih sekolah / bergantung
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-2.5 shadow-xs text-center">
              <span className="text-base font-bold text-navy">15%</span>
              <p className="mt-1 text-xs font-bold text-ink leading-tight">Prestasi IPK</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Capaian Indeks Prestasi Kumulatif minimal 3.00 s.d 4.00
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-2.5 shadow-xs text-center">
              <span className="text-base font-bold text-slate-700">5%</span>
              <p className="mt-1 text-xs font-bold text-ink leading-tight">Semester Lanjut</p>
              <p className="text-[10px] text-muted mt-1 leading-tight">
                Urgensi penyelesaian sarjana bagi mahasiswa semester atas
              </p>
            </div>
          </div>
        </div>

        {/* Alur Seleksi & Penyaluran Beasiswa yang Benar */}
        <div id="alur-pendaftaran" className="print-break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink">
              Tahapan Seleksi & Alur Pengajuan Beasiswa
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                1
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Pengumuman & Berkas</p>
              <p className="text-[10px] text-muted mt-1 leading-normal">
                Biro Kemahasiswaan & Fakultas mengumumkan periode pembukaan beasiswa. Mahasiswa melengkapi berkas persyaratan.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                2
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Pengajuan Berkas</p>
              <p className="text-[10px] text-muted mt-1 leading-normal">
                Penyerahan berkas fisik & formulir resmi pengajuan melalui Loket Kemahasiswaan Rektorat Lt. 1 / Fakultas.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                3
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Verifikasi & Skoring</p>
              <p className="text-[10px] text-muted mt-1 leading-normal">
                Admin memverifikasi keabsahan dokumen dan memasukkan data ke sistem SIMOTA untuk perhitungan skor kelayakan otomatis.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                4
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Sidang Pleno & SK</p>
              <p className="text-[10px] text-muted mt-1 leading-normal">
                Komite Beasiswa menetapkan kuota penerima berdasarkan pool dana donatur, disahkan melalui Surat Keputusan (SK) Rektor.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-ink text-[11px] font-bold">
                5
              </span>
              <p className="mt-2 font-heading text-xs font-bold text-ink">Penyaluran & Laporan</p>
              <p className="text-[10px] text-muted mt-1 leading-normal">
                Dana UKT langsung dibukukan ke tagihan kampus. Mahasiswa wajib menyerahkan KHS/laporan studi berkala tiap semester.
              </p>
            </div>
          </div>
        </div>

        {/* Kotak Informasi Layanan & QR Code */}
        <div className="print-break-inside-avoid rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] p-5 text-white shadow-md">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Informasi Pengajuan & Ketentuan Penting
                </span>
              </div>
              <h4 className="mt-1 font-heading text-lg font-bold text-white">
                Biro Kemahasiswaan & Bimbingan Konseling (BK) UIKA
              </h4>
              <p className="mt-1 text-xs text-white/90 leading-relaxed">
                Pengajuan beasiswa dikoordinasikan secara resmi melalui fakultas dan loket Biro Kemahasiswaan. Bantuan beasiswa disalurkan langsung untuk pelunasan tagihan Uang Kuliah Tunggal (UKT) di sistem keuangan kampus.
              </p>
              <p className="mt-2 text-[11px] text-white/80">
                Informasi Program & Pengumuman:{" "}
                <strong className="text-accent underline">beasiswaota.uika-bogor.ac.id</strong>
              </p>
            </div>

            <div className="sm:col-span-4 flex flex-col items-center justify-center rounded-xl bg-white p-3 text-ink shadow-sm">
              <VectorQRCode url="https://beasiswaota.uika-bogor.ac.id" size={82} />
              <span className="mt-1.5 text-[10px] font-bold text-primary text-center">
                Scan Info Portal Beasiswa
              </span>
            </div>
          </div>
        </div>

        {/* Footer Kontak & Layanan Mahasiswa */}
        <footer className="border-t border-border pt-3.5 text-[11px] text-muted flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Loket Beasiswa: Biro Kemahasiswaan, Gedung Rektorat UIKA Lt. 1, Kota Bogor</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-ink">
              <PhoneCall className="h-3.5 w-3.5 text-primary" />
              <span>{kontak1.nama}: {kontak1.nomor}</span>
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1 font-medium text-ink">
              <span>{kontak2.nama}: {kontak2.nomor}</span>
            </span>
            <span className="hidden sm:inline text-border">|</span>
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
