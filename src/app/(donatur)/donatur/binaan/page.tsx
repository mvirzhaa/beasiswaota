import Link from "next/link";
import { auth } from "@/lib/auth";
import { ambilDaftarBinaanOrtuAsuh } from "@/server/queries/relasi";
import { GrafikIpk } from "./grafik-ipk";

export default async function HalamanBinaanDonatur() {
  const session = await auth();
  const userId = session!.user.id;

  const { teridentifikasi, agregat } = await ambilDaftarBinaanOrtuAsuh(userId);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Mahasiswa Binaan</h1>
      <p className="mt-1 text-sm text-gray-600">
        Ini untuk pemantauan progres, bukan penanda dana Anda yang membiayai mahasiswa ini secara
        langsung — dana tetap dipooling.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {teridentifikasi.map((b) => (
          <div key={b.relasiId} className="rounded border p-4">
            <p className="font-medium">
              {b.nama} ({b.nim}) — {b.prodi}
            </p>
            <GrafikIpk data={b.ipkSeries} />
            {b.laporanTerbaru ? (
              <div className="mt-2 text-sm">
                <p className="font-medium">Laporan perkembangan ({b.laporanTerbaru.periodeKode}):</p>
                <p className="whitespace-pre-wrap text-gray-700">{b.laporanTerbaru.isi}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">Belum ada laporan yang boleh dibaca.</p>
            )}
            <Link href={`/donatur/pesan/${b.relasiId}`} className="mt-2 inline-block text-sm underline">
              Kirim pesan
            </Link>
          </div>
        ))}
        {teridentifikasi.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada mahasiswa binaan yang identitasnya terbuka.</p>
        )}
      </div>

      {agregat.jumlah > 0 && (
        <div className="mt-8 rounded border bg-gray-50 p-4 text-sm">
          <p className="font-medium">
            {agregat.jumlah} mahasiswa binaan lain belum menyetujui pemantauan.
          </p>
          <p className="text-gray-600">
            Rata-rata IPK terbaru:{" "}
            {agregat.rataRataIpkTerbaru !== null ? agregat.rataRataIpkTerbaru.toFixed(2) : "belum ada data"}
          </p>
        </div>
      )}
    </main>
  );
}
