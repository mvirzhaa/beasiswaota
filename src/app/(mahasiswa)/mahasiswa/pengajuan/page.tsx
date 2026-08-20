import { auth } from "@/lib/auth";
import {
  ambilPeriodePendaftaranAktif,
  ambilPengajuanMahasiswa,
} from "@/server/queries/pengajuan";
import { FileText, Calendar } from "lucide-react";
import { FormPengajuan } from "./form-pengajuan";

export default async function HalamanPengajuanMahasiswa() {
  const session = await auth();
  const userId = session!.user.id;

  const periode = await ambilPeriodePendaftaranAktif();

  if (!periode) {
    return (
      <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col gap-1 border-b border-border pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
            <FileText className="h-4 w-4 text-primary" />
            <span>Pendaftaran Beasiswa</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
            Pengajuan Beasiswa
          </h1>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-border bg-surface py-16 text-center shadow-xs">
          <Calendar className="h-12 w-12 text-muted/40" />
          <h2 className="mt-3 font-heading text-lg font-bold text-ink">
            Pendaftaran Belum Dibuka
          </h2>
          <p className="mt-1 max-w-md text-xs text-muted">
            Saat ini belum ada periode pendaftaran beasiswa yang aktif. Silakan pantau pengumuman resmi dari pengelola beasiswa UIKA Bogor.
          </p>
        </div>
      </main>
    );
  }

  const pengajuan = await ambilPengajuanMahasiswa(userId, periode.id);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <FileText className="h-4 w-4 text-primary" />
          <span>Pendaftaran Beasiswa</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Pengajuan Beasiswa
        </h1>
        <p className="text-sm text-muted">
          Periode Aktif: <strong className="text-ink">{periode.kode}</strong> (Semester {periode.semester} - {periode.tahunAkademik})
        </p>
      </div>

      <div className="mt-8">
        <FormPengajuan periodeId={periode.id} pengajuan={pengajuan} />
      </div>
    </main>
  );
}
