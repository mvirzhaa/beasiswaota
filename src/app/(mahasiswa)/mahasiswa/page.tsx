import { auth } from "@/lib/auth";
import { KartuTautan } from "@/components/ui/kartu-tautan";
import { ambilPeringatanLaporan } from "@/server/queries/laporan-perkembangan";

const TAUTAN = [
  { href: "/mahasiswa/pengajuan", judul: "Pengajuan Beasiswa", deskripsi: "Ajukan atau lihat status pengajuan Anda." },
  { href: "/mahasiswa/tagihan", judul: "Tagihan", deskripsi: "Sisa tagihan dan riwayat bantuan yang diterima." },
  { href: "/mahasiswa/laporan", judul: "Laporan Perkembangan", deskripsi: "Kirim laporan perkembangan tiap periode." },
  { href: "/mahasiswa/pembinaan", judul: "Pembinaan", deskripsi: "Setujui atau tolak pemantauan dari orang tua asuh." },
  { href: "/mahasiswa/pesan", judul: "Pesan", deskripsi: "Kirim pesan ke pembina (dimoderasi admin)." },
];

export default async function DashboardMahasiswa() {
  const session = await auth();
  const peringatan = await ambilPeringatanLaporan(session!.user.id);

  return (
    <main className="mx-auto mt-6 mb-10 max-w-4xl p-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Dashboard Mahasiswa</h1>
      <p className="mt-1 text-sm text-muted">{session?.user?.email}</p>

      {peringatan.perluDiingatkan && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Laporan perkembangan periode {peringatan.periodeBelumLaporan} belum diverifikasi, dan
          periode berikutnya sudah dibuka. Ini syarat perpanjangan beasiswa — segera lengkapi di
          halaman Laporan.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TAUTAN.map((t) => (
          <KartuTautan key={t.href} {...t} />
        ))}
      </div>
    </main>
  );
}
