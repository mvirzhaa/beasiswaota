"use client";

import { useState } from "react";
import {
  Settings,
  LayoutGrid,
  Sparkles,
  Landmark,
  CreditCard,
  Image as ImageIcon,
  ShieldCheck,
  MessageCircle,
  Award,
} from "lucide-react";
import type { PengaturanLanding } from "@/lib/pengaturan-landing/schema";
import { FormFlagNamaPenuh } from "./form-flag-nama-penuh";
import { FormHeroLanding } from "./form-hero";
import { FormPilarLanding } from "./form-pilar";
import { FormPimpinanLanding } from "./form-pimpinan";
import { FormRekeningLanding } from "./form-rekening";
import { FormKontakLanding } from "./form-kontak";
import { FormGambarLanding } from "./form-gambar";

type TabPengaturan = "SEMUA" | "TEKS_LANDING" | "PILAR" | "REKENING_KONTAK" | "GAMBAR" | "SISTEM";

interface TabItem {
  id: TabPengaturan;
  label: string;
  ikon: React.ComponentType<{ className?: string }>;
}

const DAFTAR_TAB: TabItem[] = [
  { id: "SEMUA", label: "Semua Pengaturan", ikon: LayoutGrid },
  { id: "TEKS_LANDING", label: "Hero & Pesan", ikon: Sparkles },
  { id: "PILAR", label: "4 Pilar Program", ikon: Landmark },
  { id: "REKENING_KONTAK", label: "Rekening & Kontak", ikon: CreditCard },
  { id: "GAMBAR", label: "Media & Foto", ikon: ImageIcon },
  { id: "SISTEM", label: "Privasi Laporan", ikon: ShieldCheck },
];

export function PanelPengaturan({
  aktifSaatIni,
  landing,
}: {
  aktifSaatIni: boolean;
  landing: PengaturanLanding;
}) {
  const [tabAktif, setTabAktif] = useState<TabPengaturan>("SEMUA");

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Sub-Navigasi Tab */}
      <div className="flex flex-col gap-4 border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-accent-dark">
              <Settings className="h-3.5 w-3.5" />
              <span>Konfigurasi Sistem &amp; Portal</span>
            </div>
            <h1 className="mt-1 font-heading text-2xl font-bold text-ink sm:text-3xl">
              Pengaturan Program
            </h1>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Kelola privasi nama mahasiswa pada laporan penyaluran dan seluruh konten website publik Beasiswa UIKA.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface p-1.5 shadow-2xs">
          {DAFTAR_TAB.map((tab) => {
            const Icon = tab.ikon;
            const isSelected = tabAktif === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabAktif(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted hover:bg-surface-alt/80 hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Konten Berdasarkan Tab */}
      {tabAktif === "SEMUA" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri (6 cols): Sistem, Rekening, Kontak, Pesan Pimpinan */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* 1. Privasi Laporan */}
            <KartuPengaturan
              ikon={ShieldCheck}
              judul="Privasi Nama di Laporan Donatur"
              deskripsi="Penyaluran dana publik: atur apakah nama mahasiswa disamarkan jadi inisial atau ditampilkan penuh."
            >
              <FormFlagNamaPenuh aktifSaatIni={aktifSaatIni} />
            </KartuPengaturan>

            {/* 2. Rekening Resmi */}
            <KartuPengaturan
              ikon={CreditCard}
              judul="Rekening Donasi Resmi"
              deskripsi="Informasi bank dan nomor rekening tujuan transfer donasi yang ditampilkan di landing page."
            >
              <FormRekeningLanding
                bank={landing.rekening.bank}
                nomor={landing.rekening.nomor}
                atasNama={landing.rekening.atasNama}
              />
            </KartuPengaturan>

            {/* 3. Kontak WhatsApp */}
            <KartuPengaturan
              ikon={MessageCircle}
              judul="Kontak WhatsApp Layanan Donatur"
              deskripsi="Daftar nomor pengelola yang dapat dihubungi calon orang tua asuh untuk konsultasi &amp; konfirmasi."
            >
              <FormKontakLanding kontak={landing.kontak} />
            </KartuPengaturan>

            {/* 4. Pesan Pimpinan */}
            <KartuPengaturan
              ikon={Award}
              judul="Amanah &amp; Pesan Pimpinan UIKA"
              deskripsi="Pernyataan komitmen Rektorat &amp; Pimpinan UIKA untuk transparansi beasiswa ta'awun."
            >
              <FormPimpinanLanding pesan={landing.pimpinan.pesan} />
            </KartuPengaturan>
          </div>

          {/* Kolom Kanan (6 cols): Hero, 4 Pilar, Media & Foto */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* 5. Hero Banner */}
            <KartuPengaturan
              ikon={Sparkles}
              judul="Banner Hero Landing Page"
              deskripsi="Judul utama dan deskripsi narasi yang pertama kali dilihat pengunjung di beranda portal."
            >
              <FormHeroLanding judul={landing.hero.judul} deskripsi={landing.hero.deskripsi} />
            </KartuPengaturan>

            {/* 6. 4 Pilar Utama */}
            <KartuPengaturan
              ikon={Landmark}
              judul="4 Pilar Utama Sistem Beasiswa"
              deskripsi="Nilai-nilai tata kelola program: Dana Pooling, Skoring Objektif, Monitoring, dan Transparansi."
            >
              <FormPilarLanding pilar={landing.pilar} />
            </KartuPengaturan>

            {/* 7. Gambar & Media */}
            <KartuPengaturan
              ikon={ImageIcon}
              judul="Media &amp; Galeri Foto Portal"
              deskripsi="Kelola foto logo resmi, foto banner hero, pimpinan, dan cerita kebermanfaatan beasiswa."
            >
              <FormGambarLanding gambar={landing.gambar} />
            </KartuPengaturan>
          </div>
        </div>
      )}

      {tabAktif === "TEKS_LANDING" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <KartuPengaturan
            ikon={Sparkles}
            judul="Banner Hero Landing Page"
            deskripsi="Judul utama dan deskripsi narasi yang pertama kali dilihat pengunjung di beranda portal."
          >
            <FormHeroLanding judul={landing.hero.judul} deskripsi={landing.hero.deskripsi} />
          </KartuPengaturan>

          <KartuPengaturan
            ikon={Award}
            judul="Amanah &amp; Pesan Pimpinan UIKA"
            deskripsi="Pernyataan komitmen Rektorat &amp; Pimpinan UIKA untuk transparansi beasiswa ta'awun."
          >
            <FormPimpinanLanding pesan={landing.pimpinan.pesan} />
          </KartuPengaturan>
        </div>
      )}

      {tabAktif === "PILAR" && (
        <KartuPengaturan
          ikon={Landmark}
          judul="4 Pilar Utama Sistem Beasiswa"
          deskripsi="Nilai-nilai tata kelola program: Dana Pooling, Skoring Objektif, Monitoring, dan Transparansi."
        >
          <FormPilarLanding pilar={landing.pilar} />
        </KartuPengaturan>
      )}

      {tabAktif === "REKENING_KONTAK" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <KartuPengaturan
            ikon={CreditCard}
            judul="Rekening Donasi Resmi"
            deskripsi="Informasi bank dan nomor rekening tujuan transfer donasi yang ditampilkan di landing page."
          >
            <FormRekeningLanding
              bank={landing.rekening.bank}
              nomor={landing.rekening.nomor}
              atasNama={landing.rekening.atasNama}
            />
          </KartuPengaturan>

          <KartuPengaturan
            ikon={MessageCircle}
            judul="Kontak WhatsApp Layanan Donatur"
            deskripsi="Daftar nomor pengelola yang dapat dihubungi calon orang tua asuh untuk konsultasi &amp; konfirmasi."
          >
            <FormKontakLanding kontak={landing.kontak} />
          </KartuPengaturan>
        </div>
      )}

      {tabAktif === "GAMBAR" && (
        <KartuPengaturan
          ikon={ImageIcon}
          judul="Media &amp; Galeri Foto Portal"
          deskripsi="Kelola foto logo resmi, foto banner hero, pimpinan, dan cerita kebermanfaatan beasiswa (Maks. 5MB per gambar)."
        >
          <FormGambarLanding gambar={landing.gambar} />
        </KartuPengaturan>
      )}

      {tabAktif === "SISTEM" && (
        <div className="max-w-2xl">
          <KartuPengaturan
            ikon={ShieldCheck}
            judul="Privasi Nama di Laporan Donatur"
            deskripsi="Penyaluran dana publik: atur apakah nama mahasiswa disamarkan jadi inisial (mis. A.S. — Teknik Informatika) atau ditampilkan penuh di halaman publik donatur."
          >
            <FormFlagNamaPenuh aktifSaatIni={aktifSaatIni} />
          </KartuPengaturan>
        </div>
      )}
    </div>
  );
}

function KartuPengaturan({
  ikon: Ikon,
  judul,
  deskripsi,
  children,
}: {
  ikon: React.ComponentType<{ className?: string }>;
  judul: string;
  deskripsi: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xs transition-all">
      <div className="flex items-start gap-3 border-b border-border/70 pb-3.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Ikon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-heading text-sm sm:text-base font-bold text-ink">{judul}</h2>
          <p className="mt-0.5 text-xs text-muted leading-relaxed">{deskripsi}</p>
        </div>
      </div>
      <div className="pt-1">{children}</div>
    </section>
  );
}
