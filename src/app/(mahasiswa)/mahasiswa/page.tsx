import { auth } from "@/lib/auth";
import { TombolKeluar } from "@/components/ui/tombol-keluar";
import { ambilPeringatanLaporan } from "@/server/queries/laporan-perkembangan";

export default async function DashboardMahasiswa() {
  const session = await auth();
  const peringatan = await ambilPeringatanLaporan(session!.user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Dashboard Mahasiswa</h1>
      <p className="text-sm text-gray-600">{session?.user?.email}</p>

      {peringatan.perluDiingatkan && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Laporan perkembangan periode {peringatan.periodeBelumLaporan} belum diverifikasi, dan
          periode berikutnya sudah dibuka. Ini syarat perpanjangan beasiswa — segera lengkapi di
          halaman Laporan.
        </div>
      )}

      <TombolKeluar />
    </main>
  );
}
