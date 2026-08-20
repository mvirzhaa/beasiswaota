import { auth } from "@/lib/auth";
import { KartuTautan } from "@/components/ui/kartu-tautan";

const TAUTAN = [
  { href: "/admin/pengajuan", judul: "Pengajuan", deskripsi: "Verifikasi berkas dan skor pengajuan mahasiswa." },
  { href: "/admin/komitmen", judul: "Komitmen", deskripsi: "Konfirmasi komitmen donasi baru dari donatur." },
  { href: "/admin/transaksi", judul: "Transaksi", deskripsi: "Verifikasi bukti transfer yang masuk." },
  { href: "/admin/alokasi/simulasi", judul: "Alokasi", deskripsi: "Simulasikan dan jalankan mesin alokasi dana." },
  { href: "/admin/potong-gaji", judul: "Potong Gaji", deskripsi: "Ekspor dan impor realisasi potong gaji." },
  { href: "/admin/pembinaan", judul: "Pembinaan", deskripsi: "Tugaskan relasi asuh donatur ↔ mahasiswa." },
  { href: "/admin/monitoring", judul: "Monitoring", deskripsi: "Pantau tingkat risiko akademik penerima aktif." },
  { href: "/admin/laporan", judul: "Laporan Perkembangan", deskripsi: "Review laporan perkembangan mahasiswa." },
  { href: "/admin/pesan", judul: "Pesan", deskripsi: "Moderasi pesan antara donatur dan mahasiswa binaan." },
  { href: "/admin/pengaturan", judul: "Pengaturan", deskripsi: "Atur flag dan parameter sistem." },
];

export default async function DashboardAdmin() {
  const session = await auth();

  return (
    <main className="mx-auto mt-6 mb-10 max-w-5xl p-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Dashboard Admin</h1>
      <p className="mt-1 text-sm text-muted">{session?.user?.email}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TAUTAN.map((t) => (
          <KartuTautan key={t.href} {...t} />
        ))}
      </div>
    </main>
  );
}
