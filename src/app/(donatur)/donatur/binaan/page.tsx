import Link from "next/link";
import { auth } from "@/lib/auth";
import { ambilDaftarBinaanOrtuAsuh } from "@/server/queries/relasi";
import { GrafikIpk } from "./grafik-ipk";

export default async function HalamanBinaanDonatur() {
  const session = await auth();
  const userId = session!.user.id;

  const { teridentifikasi, agregat } = await ambilDaftarBinaanOrtuAsuh(userId);

  return (
    <main className="mx-auto max-w-3xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Mahasiswa Binaan</h1>
      <p className="mt-1 text-sm text-muted">
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
                <p className="whitespace-pre-wrap text-muted">{b.laporanTerbaru.isi}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">Belum ada laporan yang boleh dibaca.</p>
            )}
            <Link href={`/donatur/pesan/${b.relasiId}`} className="mt-2 inline-block text-sm underline">
              Kirim pesan
            </Link>
          </div>
        ))}
        {teridentifikasi.length === 0 && (
          <p className="text-sm text-muted">Belum ada mahasiswa binaan yang identitasnya terbuka.</p>
        )}
      </div>

      {agregat.jumlah > 0 && (
        <div className="mt-8 rounded border bg-gray-50 p-4 text-sm">
          <p className="font-medium">
            {agregat.jumlah} mahasiswa binaan lain belum menyetujui pemantauan.
          </p>
          <p className="text-muted">
            Rata-rata IPK terbaru:{" "}
            {agregat.rataRataIpkTerbaru !== null ? agregat.rataRataIpkTerbaru.toFixed(2) : "belum ada data"}
          </p>
        </div>
      )}
    </main>
  );
}
