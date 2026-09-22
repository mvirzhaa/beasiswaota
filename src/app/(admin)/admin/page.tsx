import Link from "next/link";
import {
  Receipt,
  Shuffle,
  Users,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  ArrowRight,
  ArrowUpRight,
  Scale,
  TrendingUp,
  Building2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import { ambilStatistikKeuangan } from "@/server/queries/statistik-keuangan";
import { ambilRingkasanDashboardAdmin } from "@/server/queries/dashboard-admin";

const MODUL_MAHASISWA = [
  {
    href: "/admin/mahasiswa",
    judul: "Kelola Mahasiswa",
    deskripsi: "Pendaftaran, data akademik, dan rekam jejak beasiswa mahasiswa.",
    ikon: GraduationCap,
    badge: "Penerima",
  },
  {
    href: "/admin/orangtua-asuh",
    judul: "Kelola Orang Tua Asuh",
    deskripsi: "Data donatur yang otomatis terdata begitu mengisi form pendaftaran publik.",
    ikon: HeartHandshake,
    badge: "Donatur",
  },
  {
    href: "/admin/pembinaan",
    judul: "Penugasan Pembinaan",
    deskripsi: "Pasangkan relasi asuh moral & mentoring antara donatur dan mahasiswa.",
    ikon: Users,
    badge: "Relasi",
  },
  {
    href: "/admin/laporan",
    judul: "Review Laporan Studi",
    deskripsi: "Validasi laporan semesteran capaian IPK dan berkas scan KHS.",
    ikon: ClipboardList,
    badge: "Akademik",
  },
];

export default async function DashboardAdmin() {
  const session = await auth();
  const [statistik, ringkasan] = await Promise.all([
    ambilStatistikKeuangan(),
    ambilRingkasanDashboardAdmin(),
  ]);

  const tugas = [
    {
      warna: "#dc2626",
      judul: "Transaksi menunggu verifikasi",
      sub: "Bukti transfer BSI belum dikonfirmasi",
      jumlah: ringkasan.transaksiMenunggu,
      href: "/admin/keuangan/transaksi",
      prioritas: "Tinggi",
    },
    {
      warna: "#d97706",
      judul: "Komitmen donatur menunggu konfirmasi",
      sub: "Pendaftaran baru dari orang tua asuh",
      jumlah: ringkasan.komitmenMenunggu,
      href: "/admin/keuangan/komitmen",
      prioritas: "Sedang",
    },
    {
      warna: "#059669",
      judul: "Batch alokasi siap disetujui",
      sub: "Menunggu approval (maker-checker)",
      jumlah: ringkasan.batchSiapDisetujui,
      href: "/admin/keuangan/alokasi/simulasi",
      prioritas: "Penyaluran",
    },
  ];

  return (
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-dark">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Pusat Kendali Operasional</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Selamat datang, {session?.user?.email?.split("@")[0] ?? "Admin"}
          </h1>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            Ringkasan terpadu pendaftaran mahasiswa, pembinaan asuh, dan arus dana beasiswa.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/keuangan/transaksi"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-surface-alt transition-colors"
          >
            <Receipt className="h-3.5 w-3.5 text-primary" />
            <span>Verifikasi Mutasi</span>
            {ringkasan.transaksiMenunggu > 0 && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                {ringkasan.transaksiMenunggu}
              </span>
            )}
          </Link>
          <Link
            href="/admin/mahasiswa"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-primary-dark transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Kelola Mahasiswa</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat
          ikon={GraduationCap}
          warnaIkon="bg-primary-light text-primary-dark"
          label="Mahasiswa Penerima Aktif"
          nilai={String(ringkasan.mahasiswaAktif)}
          keterangan="Terdaftar dalam program OTA"
        />
        <KartuStat
          ikon={HeartHandshake}
          warnaIkon="bg-amber-50 text-amber-600"
          label="Orang Tua Asuh Terdaftar"
          nilai={String(ringkasan.ortuAsuhTerdaftar)}
          keterangan="Otomatis dari form pendaftaran publik"
        />
        <KartuStat
          ikon={ArrowUpRight}
          warnaIkon="bg-emerald-50 text-emerald-600"
          label="Total Pemasukan Donasi"
          nilai={formatRupiah(statistik.totalPemasukan)}
          keterangan="Akumulasi dana masuk terverifikasi"
        />
        <KartuStat
          ikon={Scale}
          warnaIkon="bg-teal-50 text-teal-700"
          label="Surplus Dana Bersih"
          nilai={formatRupiah(statistik.surplus)}
          keterangan="Pemasukan minus pengeluaran UKT"
        />
      </div>

      {/* Bento Grid 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Workflow Actions & Fast Navigation */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          {/* Panel: Perlu Tindakan Segera */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <h2 className="font-heading text-base font-bold text-ink">Perlu Tindakan Segera</h2>
              </div>
              <span className="rounded-md bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-muted">
                Antrean Tugas
              </span>
            </div>

            <div className="divide-y divide-border/60">
              {tugas.map((t) => (
                <Link
                  key={t.judul}
                  href={t.href}
                  className="group flex items-center justify-between gap-3 py-3 px-2 rounded-xl transition-all hover:bg-surface-alt/70"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.warna }} />
                    <div className="min-w-0">
                      <div className="truncate text-xs sm:text-[13px] font-semibold text-ink group-hover:text-primary transition-colors">
                        {t.judul}
                      </div>
                      <div className="truncate text-[11px] text-muted">{t.sub}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        t.jumlah > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-surface-alt text-muted"
                      }`}
                    >
                      {t.jumlah}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Panel: Navigasi Modul Mahasiswa & Pembinaan */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-muted">
                Mahasiswa & Donatur
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {MODUL_MAHASISWA.map((m) => {
                const Icon = m.ikon;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-3.5 transition-all hover:border-primary/50 hover:shadow-xs hover:bg-surface-alt/40"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary group-hover:scale-105 transition-transform">
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="rounded bg-surface-alt px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
                          {m.badge}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-ink group-hover:text-primary transition-colors">
                        {m.judul}
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted line-clamp-2">
                        {m.deskripsi}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): Metrics & Quick Controls */}
        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          {/* Panel: Info Rekening Penampung & Arus Kas */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-ink">Rekening Donasi Pusat</h2>
            </div>
            <div className="rounded-xl border border-border bg-surface-alt/70 p-3.5 text-xs">
              <div className="text-[11px] font-medium text-muted">Bank Syariah Indonesia (BSI)</div>
              <div className="mt-0.5 font-mono text-base font-bold text-ink tracking-wider">
                7367215121
              </div>
              <div className="mt-1 text-[11px] text-muted">a.n. Orang Tua Asuh UIKA Bogor</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-xl border border-border bg-surface p-2.5">
                <div className="text-[10.5px] text-muted">Batch Alokasi</div>
                <div className="mt-0.5 font-heading text-sm font-bold text-ink">
                  {ringkasan.batchSiapDisetujui} Siap
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-2.5">
                <div className="text-[10.5px] text-muted">Komitmen Masuk</div>
                <div className="mt-0.5 font-heading text-sm font-bold text-ink">
                  {ringkasan.komitmenMenunggu} Menunggu
                </div>
              </div>
            </div>

            <div className="mt-3.5 border-t border-border pt-3">
              <Link
                href="/admin/keuangan"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary-light/50 py-2 text-xs font-bold text-primary-dark transition-colors hover:bg-primary-light"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Buka Pemasukan & Pengeluaran</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function KartuStat({
  ikon: Ikon,
  warnaIkon,
  label,
  nilai,
  keterangan,
}: {
  ikon: typeof GraduationCap;
  warnaIkon: string;
  label: string;
  nilai: string;
  keterangan?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 shadow-2xs transition-all hover:border-primary/40">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${warnaIkon}`}>
          <Ikon className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <span className="text-[11px] font-medium text-muted line-clamp-1">{label}</span>
      </div>
      <div className="mt-3">
        <div className="truncate font-heading text-2xl font-bold text-ink">{nilai}</div>
        {keterangan && <div className="mt-0.5 text-[11px] text-muted truncate">{keterangan}</div>}
      </div>
    </div>
  );
}
