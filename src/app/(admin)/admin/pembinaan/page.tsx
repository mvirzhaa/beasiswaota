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
    <main className="mx-auto mt-6 mb-12 max-w-5xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <Users className="h-4 w-4 text-primary" />
          <span>Mentoring & Pendampingan</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Penugasan Pembinaan Relasi Asuh
        </h1>
        <p className="text-sm text-muted">
          Hubungkan donatur dan mahasiswa untuk tujuan pendampingan moral & monitoring perkembangan studi.
        </p>
      </div>

      {/* Info Ketentuan Sistem */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 text-xs text-ink shadow-xs">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="leading-relaxed">
          <p className="font-bold text-primary-dark">Prinsip Relasi Asuh:</p>
          <p className="mt-0.5 text-muted">
            Relasi pembinaan ini murni untuk pemantauan capaian studi dan silaturahmi termoderasi — <strong>TIDAK menentukan</strong> secara eksklusif aliran dana transfer donatur mana yang membiayai mahasiswa mana (seluruh dana dikelola secara pooling terpusat).
          </p>
        </div>
      </div>

      {/* Seksi 1: Tugaskan Relasi Baru */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <UserPlus className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg font-bold text-ink">Tugaskan Relasi Asuh Baru</h2>
        </div>
        <div className="mt-4">
          <FormTugaskan
            ortuAsuhList={ortuAsuhList}
            mahasiswaList={mahasiswaList}
            periodeList={periodeList}
          />
        </div>
      </section>

      {/* Seksi 2: Daftar Relasi Aktif */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-lg font-bold text-ink">Daftar Relasi Pembinaan</h2>
          </div>
          <span className="text-xs font-semibold text-muted">{relasiList.length} Relasi</span>
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
            <p className="py-8 text-center text-xs text-muted">
              Belum ada data relasi pembinaan yang ditugaskan.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
