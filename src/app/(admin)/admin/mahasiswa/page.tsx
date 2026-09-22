import Link from "next/link";
import { GraduationCap, Search, ArrowRight, UserCheck } from "lucide-react";
import { ambilDaftarMahasiswaAdmin, ambilPeriodeUntukAdminMahasiswa } from "@/server/queries/mahasiswa";
import { Lencana } from "@/components/ui/lencana";
import { FormBuatMahasiswa } from "./form-buat-mahasiswa";
import { ModalImporMonitoring } from "./modal-impor-monitoring";

const NADA_STATUS_AKADEMIK: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  AKTIF: "sukses",
  CUTI: "peringatan",
  LULUS: "info",
  DO: "bahaya",
};

export default async function HalamanMahasiswaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ cari?: string }>;
}) {
  const params = await searchParams;
  const [mahasiswaList, periodeList] = await Promise.all([
    ambilDaftarMahasiswaAdmin({ cari: params.cari }),
    ambilPeriodeUntukAdminMahasiswa(),
  ]);

  return (
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>Basis Data Penerima</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">Kelola Mahasiswa</h1>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            Daftar seluruh mahasiswa penerima manfaat program beasiswa Orang Tua Asuh UIKA.
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Action */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <form method="GET" className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              name="cari"
              defaultValue={params.cari}
              placeholder="Cari berdasarkan nama atau NIM..."
              className="w-full rounded-xl border border-border bg-surface-alt/60 pl-9 pr-3 py-2 text-xs text-ink placeholder:text-muted focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-alt transition-colors"
          >
            Cari
          </button>
          {params.cari && (
            <Link
              href="/admin/mahasiswa"
              className="rounded-xl px-2.5 py-2 text-xs text-muted hover:text-ink transition-colors"
            >
              Reset
            </Link>
          )}
        </form>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted lg:inline">
            Total <strong>{mahasiswaList.length}</strong> mahasiswa
          </span>
          <ModalImporMonitoring periodeList={periodeList} />
          <FormBuatMahasiswa />
        </div>
      </div>

      {/* Tabel Data Mahasiswa */}
      <div className="mt-6 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-alt/60 text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="py-3.5 pl-5 pr-4">Mahasiswa</th>
                <th className="py-3.5 px-4">NIM</th>
                <th className="py-3.5 px-4">Program Studi & Fakultas</th>
                <th className="py-3.5 px-4 text-center">Angkatan / Smtr</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 pl-4 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {mahasiswaList.map((m) => {
                const inisial = m.nama
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={m.id} className="transition-colors hover:bg-surface-alt/50">
                    <td className="py-3 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light font-heading text-xs font-bold text-primary">
                          {inisial}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/mahasiswa/${m.id}`}
                            className="font-bold text-ink hover:text-primary transition-colors line-clamp-1"
                          >
                            {m.nama}
                          </Link>
                          <div className="text-[11px] text-muted">{m.noHp || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-ink">{m.nim}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">{m.prodi}</div>
                      <div className="text-[11px] text-muted">{m.fakultas}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-ink">{m.angkatan}</span>
                      <span className="text-muted"> / Smtr {m.semesterBerjalan}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Lencana nada={NADA_STATUS_AKADEMIK[m.statusAkademik] ?? "netral"}>
                        {m.statusAkademik}
                      </Lencana>
                    </td>
                    <td className="py-3 pl-4 pr-5 text-right">
                      <Link
                        href={`/admin/mahasiswa/${m.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface-alt hover:border-primary/40 transition-all"
                      >
                        <span>Detail</span>
                        <ArrowRight className="h-3 w-3 text-muted" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {mahasiswaList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-muted mb-2">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-medium text-ink">Tidak ada data mahasiswa ditemukan</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {params.cari ? "Coba gunakan kata kunci pencarian lain" : "Belum ada mahasiswa yang ditambahkan"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
