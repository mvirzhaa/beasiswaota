import { auth } from "@/lib/auth";
import { ambilRelasiMahasiswa } from "@/server/queries/relasi";
import { TombolPersetujuan } from "./tombol-persetujuan";

export default async function HalamanPembinaanMahasiswa() {
  const session = await auth();
  const userId = session!.user.id;

  const relasiList = await ambilRelasiMahasiswa(userId);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Pembinaan</h1>
      <p className="mt-1 text-sm text-gray-600">
        Orang tua asuh berikut ditugaskan admin untuk memantau progres akademik Anda. Anda boleh
        menyetujui atau menolak, dan boleh menarik persetujuan kapan saja tanpa memengaruhi
        beasiswa Anda.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {relasiList.map((r) => (
          <div key={r.id} className="rounded border p-3 text-sm">
            <p className="font-medium">
              {r.ortuAsuh.anonim ? "Donatur (anonim)" : r.ortuAsuh.atasNamaMunfiq || r.ortuAsuh.nama}
            </p>
            <p className="text-gray-600">
              Sejak periode {r.periodeMulai.kode} · Status persetujuan:{" "}
              {r.persetujuanMahasiswa ? "Disetujui" : "Belum disetujui"}
            </p>
            <div className="mt-2">
              <TombolPersetujuan relasiId={r.id} disetujui={r.persetujuanMahasiswa} />
            </div>
          </div>
        ))}
        {relasiList.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada relasi pembinaan.</p>
        )}
      </div>
    </main>
  );
}
