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
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">Pengajuan Beasiswa</h1>
        <p className="mt-4 text-sm text-gray-600">
          Belum ada periode pendaftaran yang dibuka saat ini.
        </p>
      </main>
    );
  }

  const pengajuan = await ambilPengajuanMahasiswa(userId, periode.id);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Pengajuan Beasiswa</h1>
      <p className="mt-1 text-sm text-gray-600">Periode {periode.kode}</p>

      <div className="mt-6">
        <FormPengajuan periodeId={periode.id} pengajuan={pengajuan} />
      </div>
    </main>
  );
}
