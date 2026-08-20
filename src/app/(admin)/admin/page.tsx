import Link from "next/link";
import {
  FileText,
  Receipt,
  HandCoins,
  Shuffle,
  Wallet,
  Users,
  Activity,
  ClipboardList,
  MessageCircle,
  UserCog,
  Settings,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Tombol } from "@/components/ui/tombol";

const KELOMPOK = [
  {
    judul: "Operasional Beasiswa",
    keterangan: "Pengelolaan berkas pengajuan, penerimaan donasi, dan penyaluran bantuan",
    warna: "text-primary",
    tautan: [
      {
        href: "/admin/pengajuan",
        judul: "Verifikasi Pengajuan",
        deskripsi: "Verifikasi kelayakan berkas, hitung skor ekonomi, dan setujui penerima beasiswa.",
        ikon: FileText,
        badge: "Pendaftaran",
      },
      {
        href: "/admin/transaksi",
        judul: "Verifikasi Transaksi",
        deskripsi: "Tinjau bukti setoran rekening BSI 7367215121 dan konfirmasi dana masuk.",
        ikon: Receipt,
        badge: "Finansial",
      },
      {
        href: "/admin/komitmen",
        judul: "Komitmen Donatur",
        deskripsi: "Konfirmasi dan kelola jadwal komitmen donasi rutin dari orang tua asuh.",
        ikon: HandCoins,
        badge: "Donasi",
      },
      {
        href: "/admin/alokasi/simulasi",
        judul: "Mesin Alokasi Dana",
        deskripsi: "Simulasikan dan eksekusi algoritma pemotongan tagihan UKT mahasiswa.",
        ikon: Shuffle,
        badge: "Algoritma",
      },
      {
        href: "/admin/potong-gaji",
        judul: "Potong Gaji Karyawan",
        deskripsi: "Ekspor daftar dan impor realisasi potongan gaji pegawai/dosen UIKA.",
        ikon: Wallet,
        badge: "Payroll",
      },
    ],
  },
  {
    judul: "Pembinaan & Pemantauan",
    keterangan: "Monitoring prestasi akademik mahasiswa dan pendampingan orang tua asuh",
    warna: "text-accent-dark",
    tautan: [
      {
        href: "/admin/pembinaan",
        judul: "Penugasan Pembinaan",
        deskripsi: "Pasangkan relasi asuh antara donatur dan mahasiswa penerima bantuan.",
        ikon: Users,
        badge: "Relasi",
      },
      {
        href: "/admin/monitoring",
        judul: "Monitoring Risiko Akademik",
        deskripsi: "Pantau capaian IPK, peringatan dini risiko putus studi, dan status semester.",
        ikon: Activity,
        badge: "Risiko",
      },
      {
        href: "/admin/laporan",
        judul: "Review Laporan Studi",
        deskripsi: "Validasi laporan berkala capaian perkuliahan dan scan KHS mahasiswa.",
        ikon: ClipboardList,
        badge: "Akademik",
      },
      {
        href: "/admin/pesan",
        judul: "Moderasi Pesan",
        deskripsi: "Tinjau dan loloskan pesan silaturahmi antara donatur dan mahasiswa binaan.",
        ikon: MessageCircle,
        badge: "Komunikasi",
      },
    ],
  },
  {
    judul: "Manajemen Sistem",
    keterangan: "Konfigurasi parameter sistem, audit trail, dan akun pengguna",
    warna: "text-navy",
    tautan: [
      {
        href: "/admin/akun",
        judul: "Kelola Akun Pengguna",
        deskripsi: "Aktivasi akun donatur baru, daftarkan data mahasiswa penerima langsung.",
        ikon: UserCog,
        badge: "Pengguna",
      },
      {
        href: "/admin/pengaturan",
        judul: "Pengaturan Sistem",
        deskripsi: "Konfigurasi batas waktu pelaporan, flag fitur, dan parameter beasiswa.",
        ikon: Settings,
        badge: "Konfigurasi",
      },
    ],
  },
];

export default async function DashboardAdmin() {
  const session = await auth();

  return (
    <main className="mx-auto mt-6 mb-16 max-w-6xl px-4 sm:px-6">
      {/* 1. Executive Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] text-white shadow-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-accent uppercase backdrop-blur-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Pusat Kendali Pengelola Beasiswa UIKA Bogor</span>
          </div>

          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Dashboard Administrasi & Operasional
          </h1>

          <p className="mt-2 text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
            Kelola verifikasi berkas pengajuan, monitoring realisasi donasi rekening BSI, eksekusi alokasi UKT mahasiswa, dan pengawasan mutu akademik secara akuntabel.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/80 border-t border-white/15 pt-4">
            <span className="font-medium">Administrator Bertugas:</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-accent">
              {session?.user?.email ?? "Administrator"}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Modul Operasional Terkelompok */}
      <div className="mt-12 flex flex-col gap-12">
        {KELOMPOK.map((k) => (
          <section key={k.judul}>
            <div className="flex flex-wrap items-end justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-ink">{k.judul}</h2>
                <p className="mt-0.5 text-xs text-muted">{k.keterangan}</p>
              </div>
              <span className="text-xs font-semibold text-muted">{k.tautan.length} Modul</span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {k.tautan.map((t) => {
                const Icon = t.ikon;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                          <Icon className="h-6 w-6" strokeWidth={1.75} />
                        </span>
                        <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                          {t.badge}
                        </span>
                      </div>

                      <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                        {t.judul}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">
                        {t.deskripsi}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
                      <span>Akses Modul</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
