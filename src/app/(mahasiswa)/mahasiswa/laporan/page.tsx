import { auth } from "@/lib/auth";
import {
  ambilPeriodePenerimaMahasiswa,
  ambilLaporanMahasiswa,
} from "@/server/queries/laporan-perkembangan";
import { ClipboardList, Calendar, Info } from "lucide-react";
import { FormLaporan } from "./form-laporan";
import { Tombol } from "@/components/ui/tombol";

export default async function HalamanLaporanMahasiswa({
  searchParams,
}: {
  searchParams: Promise<{ periodeId?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const params = await searchParams;

  const periodeList = await ambilPeriodePenerimaMahasiswa(userId);
  const periodeId = params.periodeId || periodeList[0]?.id;

  if (!periodeId) {
    return (
      <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col gap-1 border-b border-border pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span>Monitoring Akademik</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
            Laporan Perkembangan Studi
          </h1>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-border bg-surface py-16 text-center shadow-xs">
          <Info className="h-12 w-12 text-muted/40" />
          <h2 className="mt-3 font-heading text-lg font-bold text-ink">
            Belum Tercatat Sebagai Penerima Beasiswa
          </h2>
          <p className="mt-1 max-w-md text-xs text-muted">
            Menu pelaporan hanya dapat diakses oleh mahasiswa yang telah ditetapkan sebagai penerima beasiswa aktif.
          </p>
        </div>
      </main>
    );
  }

  const laporan = await ambilLaporanMahasiswa(userId, periodeId);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span>Monitoring Akademik</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Laporan Perkembangan Studi
        </h1>
        <p className="text-sm text-muted">
          Kirimkan laporan capaian akademik (IPK & kegiatan) sebagai syarat kelanjutan beasiswa tiap semester.
        </p>
      </div>

      {/* Filter Periode */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <form className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-ink">Pilih Periode Semester:</span>
          <select
            name="periodeId"
            defaultValue={periodeId}
            className="rounded-xl border border-border bg-surface-alt px-3 py-1.5 text-xs text-ink font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {periodeList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kode} (Semester {p.semester} - {p.tahunAkademik})
              </option>
            ))}
          </select>
          <Tombol type="submit" variant="primer" ukuran="sm">
            Tampilkan
          </Tombol>
        </form>
      </div>

      <div className="mt-6">
        <FormLaporan periodeId={periodeId} laporan={laporan} />
      </div>
    </main>
  );
}
