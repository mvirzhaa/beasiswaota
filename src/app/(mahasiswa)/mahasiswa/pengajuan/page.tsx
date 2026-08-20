import { auth } from "@/lib/auth";
import {
  ambilPeriodePendaftaranAktif,
  ambilPengajuanMahasiswa,
} from "@/server/queries/pengajuan";
import { FormPengajuan } from "./form-pengajuan";

export default async function HalamanPengajuanMahasiswa() {
  const session = await auth();
  const userId = session!.user.id;

  const periode = await ambilPeriodePendaftaranAktif();

  if (!periode) {
    return (
      <main className="mx-auto max-w-2xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
        <h1 className="font-heading text-2xl font-bold text-ink">Pengajuan Beasiswa</h1>
        <p className="mt-4 text-sm text-muted">
          Belum ada periode pendaftaran yang dibuka saat ini.
        </p>
      </main>
    );
  }

  const pengajuan = await ambilPengajuanMahasiswa(userId, periode.id);

  return (
    <main className="mx-auto max-w-2xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Pengajuan Beasiswa</h1>
      <p className="mt-1 text-sm text-muted">Periode {periode.kode}</p>

      <div className="mt-6">
        <FormPengajuan periodeId={periode.id} pengajuan={pengajuan} />
      </div>
    </main>
  );
}
