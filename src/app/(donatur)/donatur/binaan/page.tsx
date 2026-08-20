import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ambilDaftarBinaanOrtuAsuh } from "@/server/queries/relasi";
import { Users, MessageCircle, FileText, ShieldAlert, GraduationCap, TrendingUp, Info } from "lucide-react";
import { GrafikIpk } from "./grafik-ipk";

export default async function HalamanBinaanDonatur() {
  const session = await auth();
  const userId = session!.user.id;

  const { teridentifikasi, agregat } = await ambilDaftarBinaanOrtuAsuh(userId);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-5xl px-4 sm:px-6">
      {/* Header Halaman & Banner Visual */}
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary-dark via-primary to-[#0e584f] text-white shadow-md">
        <div className="grid grid-cols-1 items-center gap-6 p-6 sm:p-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-accent uppercase">
              <Users className="h-3.5 w-3.5" />
              <span>Pembinaan & Monitoring Akademik</span>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold sm:text-3xl text-white">
              Mahasiswa Binaan
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-white/85 leading-relaxed">
              Pantau kemajuan studi, indeks prestasi kumulatif (IPK), dan laporan perkembangan mahasiswa yang Anda dampingi.
            </p>
          </div>

          <div className="md:col-span-5 flex justify-end">
            <div className="relative overflow-hidden rounded-2xl border-2 border-white/20 shadow-lg w-full max-w-xs">
              <Image
                src="/images/beasiswa-keluarga-2.jpg"
                alt="Mahasiswa Binaan dan Keluarga"
                width={400}
                height={260}
                className="h-36 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                <p className="text-[11px] text-white/90 font-medium">
                  Pendampingan Moral & Dukungan Studi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catatan Kebijakan Pemantauan */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 text-xs leading-relaxed text-primary-dark shadow-xs">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <span className="font-semibold text-ink">Prinsip Hubungan Pembinaan:</span> Penugasan mahasiswa binaan
          bertujuan untuk pendampingan moral dan monitoring akademik, dan <strong>terpisah dari aliran dana</strong> (seluruh dana donasi dihimpun dalam pool beasiswa bersama untuk asas keadilan).
        </div>
      </div>

      {/* Daftar Mahasiswa Binaan Terbuka */}
      <div className="mt-8 flex flex-col gap-6">
        {teridentifikasi.map((b) => {
          const inisial = b.nama
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <div
              key={b.relasiId}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-200 hover:shadow-md"
            >
              {/* Header Kartu Mahasiswa */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-alt/30 p-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark font-heading text-base font-bold text-white shadow-xs">
                    {inisial}
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-ink">{b.nama}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-mono">NIM: {b.nim}</span>
                      <span>•</span>
                      <span className="rounded-full bg-primary-light px-2.5 py-0.5 font-medium text-primary-dark">
                        {b.prodi}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/donatur/pesan/${b.relasiId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-primary-dark hover:shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Kirim Pesan</span>
                </Link>
              </div>

              {/* Konten Kartu */}
              <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
                {/* Grafik IPK */}
                <div className="lg:col-span-6">
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>Grafik Perkembangan IPK</span>
                    </div>
                    <span className="text-[11px] text-muted">Skala 0.00 – 4.00</span>
                  </div>
                  <GrafikIpk data={b.ipkSeries} />
                </div>

                {/* Laporan Perkembangan Terbaru */}
                <div className="flex flex-col justify-between border-t border-border pt-4 lg:col-span-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                  <div>
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                        <FileText className="h-4 w-4 text-accent-dark" />
                        <span>Laporan Perkembangan Terakhir</span>
                      </div>
                      {b.laporanTerbaru && (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent-dark">
                          Periode {b.laporanTerbaru.periodeKode}
                        </span>
                      )}
                    </div>

                    {b.laporanTerbaru ? (
                      <div className="mt-2 rounded-xl border border-border/80 bg-surface-alt/40 p-4 text-xs leading-relaxed text-ink/90">
                        <p className="whitespace-pre-wrap italic">
                          &ldquo;{b.laporanTerbaru.isi}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-alt/20 p-4 text-center text-xs text-muted">
                        <FileText className="h-6 w-6 opacity-40" />
                        <p className="mt-1 font-medium">Belum Ada Laporan yang Dapat Dibaca</p>
                        <p className="text-[11px] opacity-75">
                          Laporan mahasiswa akan muncul di sini setelah diverifikasi pengelola.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
                    <span>Relasi Pembinaan Aktif</span>
                    <span>UIKA Beasiswa OTA</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {teridentifikasi.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-12 text-center shadow-xs">
            <GraduationCap className="h-12 w-12 text-muted/40" />
            <h3 className="mt-3 font-heading text-lg font-bold text-ink">
              Belum Ada Mahasiswa Binaan Terbuka
            </h3>
            <p className="mt-1 max-w-md text-xs text-muted">
              Admin belum menugaskan mahasiswa binaan, atau mahasiswa binaan Anda belum memberikan
              persetujuan pembukaan data profil.
            </p>
          </div>
        )}
      </div>

      {/* Bagian Binaan Agregat (Belum Setuju Buka Identitas) */}
      {agregat.jumlah > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 text-sm text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-heading text-base font-bold text-amber-950">
                {agregat.jumlah} Mahasiswa Binaan Belum Menyetujui Pembagian Profil
              </h3>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Sesuai kode etik perlindungan privasi penerima beasiswa, identitas detail disamarkan sampai mahasiswa memberikan persetujuan monitoring.
              </p>
              <div className="mt-3 flex items-center gap-4 rounded-xl border border-amber-200 bg-white/70 px-4 py-2.5 text-xs">
                <div>
                  <span className="text-muted">Jumlah Binaan:</span>
                  <span className="ml-1 font-bold text-ink">{agregat.jumlah} Mahasiswa</span>
                </div>
                <div className="h-4 w-px bg-amber-200" />
                <div>
                  <span className="text-muted">Rata-rata IPK Terbaru:</span>
                  <span className="ml-1 font-bold text-primary">
                    {agregat.rataRataIpkTerbaru !== null ? agregat.rataRataIpkTerbaru.toFixed(2) : "Belum ada data"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
