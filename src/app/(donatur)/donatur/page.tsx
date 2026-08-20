import { auth } from "@/lib/auth";
import { KartuTautan } from "@/components/ui/kartu-tautan";

const TAUTAN = [
  { href: "/donatur/komitmen", judul: "Komitmen", deskripsi: "Buat komitmen donasi baru atau lihat yang sudah ada." },
  { href: "/donatur/pembayaran", judul: "Pembayaran", deskripsi: "Jadwal bayar, unggah bukti transfer, riwayat transaksi." },
  { href: "/donatur/binaan", judul: "Mahasiswa Binaan", deskripsi: "Pantau progres mahasiswa binaan Anda." },
  { href: "/donatur/laporan", judul: "Laporan Penyaluran", deskripsi: "Lihat ke mana saja dana Anda tersalurkan." },
  { href: "/donatur/pesan", judul: "Pesan", deskripsi: "Kirim pesan ke mahasiswa binaan (dimoderasi admin)." },
];

export default async function DashboardDonatur() {
  const session = await auth();

  return (
    <main className="mx-auto mt-6 mb-10 max-w-4xl p-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Dashboard Orang Tua Asuh</h1>
      <p className="mt-1 text-sm text-muted">{session?.user?.email}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TAUTAN.map((t) => (
          <KartuTautan key={t.href} {...t} />
        ))}
      </div>
    </main>
  );
}
