import { prisma } from "@/lib/db";
import {
  ambilDaftarRelasiAdmin,
  ambilOrtuAsuhUntukPenugasan,
  ambilMahasiswaUntukPenugasan,
} from "@/server/queries/relasi";
import { Users, UserPlus, Info, HeartHandshake } from "lucide-react";
import { FormTugaskan } from "./form-tugaskan";
import { BarisRelasi } from "./baris-relasi";

export default async function HalamanPembinaanAdmin() {
  const [relasiList, ortuAsuhList, mahasiswaList, periodeList] = await Promise.all([
    ambilDaftarRelasiAdmin(),
    ambilOrtuAsuhUntukPenugasan(),
    ambilMahasiswaUntukPenugasan(),
    prisma.periode.findMany({ orderBy: { tglBuka: "desc" }, select: { id: true, kode: true } }),
  ]);

  return (
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <Users className="h-4 w-4 text-primary" />
          <span>Mentoring & Pendampingan</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Penugasan Pembinaan Relasi Asuh
        </h1>
        <p className="mt-0.5 text-xs text-muted sm:text-sm">
          Hubungkan donatur dan mahasiswa penerima untuk pendampingan moral, motivasi studi, dan silaturahmi berkala.
        </p>
      </div>

      {/* 2-Column Side-by-Side Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (5 cols): Form Penugasan + Info */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-20">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <UserPlus className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-ink">Tugaskan Relasi Baru</h2>
            </div>
            <div className="mt-4">
              <FormTugaskan
                ortuAsuhList={ortuAsuhList}
                mahasiswaList={mahasiswaList}
                periodeList={periodeList}
              />
            </div>
          </section>

          {/* Info Ketentuan Sistem */}
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 text-xs text-ink shadow-2xs">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="leading-relaxed">
              <p className="font-bold text-primary-dark">Prinsip Relasi Asuh:</p>
              <p className="mt-1 text-muted">
                Relasi pembinaan ini murni untuk pemantauan capaian studi dan komunikasi termoderasi — <strong>TIDAK menentukan</strong> secara eksklusif aliran dana (seluruh donasi dikelola secara pooling terpusat).
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Daftar Relasi Aktif */}
        <div className="lg:col-span-7 xl:col-span-8">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-base font-bold text-ink">Daftar Relasi Pembinaan</h2>
              </div>
              <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-bold text-ink">
                {relasiList.length} Pasangan Aktif
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {relasiList.map((r) => (
                <BarisRelasi
                  key={r.id}
                  relasi={r}
                  ortuAsuhList={ortuAsuhList}
                  periodeList={periodeList}
                />
              ))}
              {relasiList.length === 0 && (
                <div className="py-12 text-center text-xs text-muted">
                  <HeartHandshake className="mx-auto h-8 w-8 text-muted/50 mb-2" />
                  <p className="font-semibold text-ink">Belum ada relasi pembinaan</p>
                  <p className="text-[11px] text-muted">Gunakan formulir di sebelah kiri untuk memasangkan donatur dan mahasiswa.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
