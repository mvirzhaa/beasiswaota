import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Receipt,
  ClipboardList,
  Users,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Sparkles,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Tombol } from "@/components/ui/tombol";
import { ambilPeringatanLaporan } from "@/server/queries/laporan-perkembangan";

export default async function DashboardMahasiswa() {
  const session = await auth();
  const peringatan = await ambilPeringatanLaporan(session!.user.id);

  return (
    <main className="mx-auto mt-6 mb-16 max-w-6xl px-4 sm:px-6">
      {/* 1. Visual Hero Banner Mahasiswa */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] text-white shadow-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="grid grid-cols-1 items-center gap-8 p-6 sm:p-10 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-accent uppercase backdrop-blur-xs">
              <GraduationCap className="h-4 w-4" />
              <span>Portal Mahasiswa Penerima Beasiswa</span>
            </div>

            <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-white sm:text-4xl lg:leading-tight">
              Selamat Datang di Portal Beasiswa
            </h1>

            <p className="mt-2 text-sm sm:text-base text-white/90 leading-relaxed max-w-xl">
              Pantau status pengajuan bantuan, pantau riwayat pemotongan UKT, dan laporkan perkembangan akademik Anda setiap semester.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/mahasiswa/pengajuan">
                <Tombol variant="aksen" ukuran="md" className="font-bold shadow-md text-ink">
                  <FileText className="h-4 w-4" />
                  <span>Pengajuan Beasiswa</span>
                </Tombol>
              </Link>
              <Link href="/mahasiswa/laporan">
                <Tombol variant="garis" ukuran="md" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <ClipboardList className="h-4 w-4" />
                  <span>Kirim Laporan Studi</span>
                </Tombol>
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-3 text-xs text-white/75 border-t border-white/15 pt-4">
              <span className="font-medium">Akun Mahasiswa:</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-accent">
                {session?.user?.email ?? "Mahasiswa UIKA"}
              </span>
            </div>
          </div>

          {/* Foto Cerita Mahasiswa */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-white/20 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src="/images/beasiswa-keluarga-2.jpg"
                alt="Mahasiswa dan Keluarga Beasiswa UIKA"
                width={600}
                height={400}
                className="h-64 sm:h-72 w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/40 p-3 backdrop-blur-xs text-xs text-white/95 border border-white/10">
                <p className="font-semibold text-accent flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Semangat Meraih Prestasi</span>
                </p>
                <p className="mt-0.5 text-[11px] text-white/80">
                  Terus tingkatkan nilai IPK dan jaga amanah beasiswa Orang Tua Asuh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Banner Peringatan Pelaporan (Jika Diperlukan) */}
      {peringatan.perluDiingatkan && (
        <div className="mt-6 flex items-start gap-3.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-950 shadow-xs">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="leading-relaxed">
            <p className="font-bold">Pengingat Laporan Perkembangan Studi:</p>
            <p className="mt-0.5 text-amber-800">
              Laporan perkembangan periode <strong>{peringatan.periodeBelumLaporan}</strong> belum diverifikasi, dan periode berikutnya telah dibuka. Laporan ini merupakan syarat mutlak perpanjangan beasiswa.
            </p>
            <div className="mt-2">
              <Link href="/mahasiswa/laporan">
                <Tombol variant="primer" ukuran="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Lengkapi Laporan Sekarang &rarr;
                </Tombol>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Pusat Layanan & Navigasi Modul Mahasiswa */}
      <section className="mt-12">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">
              Layanan Beasiswa Mahasiswa
            </h2>
            <p className="text-xs text-muted">Akses seluruh informasi bantuan biaya kuliah dan pendampingan</p>
          </div>
          <span className="text-xs font-medium text-accent-dark">5 Fitur Utama</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Modul 1: Pengajuan */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                  <FileText className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Pendaftaran
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Pengajuan Beasiswa
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Isi formulir pengajuan, unggah dokumen pendukung (SKTM, Slip Gaji, Foto Rumah), dan pantau status verifikasi.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/mahasiswa/pengajuan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Buka Pengajuan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 2: Tagihan */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark transition-colors group-hover:bg-accent group-hover:text-ink shadow-xs">
                  <Receipt className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Finansial
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Tagihan & Bantuan UKT
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Lihat rincian tagihan UKT semester berjalan, total bantuan beasiswa yang telah memotong tagihan, dan sisa kewajiban.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/mahasiswa/tagihan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Lihat Tagihan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 3: Laporan Perkembangan */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                  <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Akademik
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Laporan Perkembangan
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Kirimkan laporan capaian IPK, KHS/KRS, dan prestasi kegiatan tiap semester sebagai evaluasi beasiswa.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/mahasiswa/laporan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Kirim Laporan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 4: Pembinaan */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white shadow-xs">
                  <Users className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                  Mentoring
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Relasi Pembinaan
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Setujui atau kelola persetujuan pemantauan progres studi dari Orang Tua Asuh pendamping Anda.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/mahasiswa/pembinaan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Kelola Pembinaan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Modul 5: Pesan */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md md:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark transition-colors group-hover:bg-accent group-hover:text-ink shadow-xs">
                  <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-primary-dark">
                  Silaturahmi
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                Pesan & Silaturahmi
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted max-w-xl">
                Kirim pesan terima kasih, sapaan, atau konsultasi perkembangan studi kepada orang tua asuh melalui sistem pesan termoderasi.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <Link
                href="/mahasiswa/pesan"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                <span>Buka Percakapan Pesan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
