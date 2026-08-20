import { HandCoins, Wallet, Users, ClipboardList, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { HeroDashboard } from "@/components/ui/hero-dashboard";
import { KartuTautan } from "@/components/ui/kartu-tautan";

const TAUTAN = [
  { href: "/donatur/komitmen", judul: "Komitmen", deskripsi: "Buat komitmen donasi baru atau lihat yang sudah ada.", ikon: HandCoins },
  { href: "/donatur/pembayaran", judul: "Pembayaran", deskripsi: "Jadwal bayar, unggah bukti transfer, riwayat transaksi.", ikon: Wallet },
  { href: "/donatur/binaan", judul: "Mahasiswa Binaan", deskripsi: "Pantau progres mahasiswa binaan Anda.", ikon: Users },
  { href: "/donatur/laporan", judul: "Laporan Penyaluran", deskripsi: "Lihat ke mana saja dana Anda tersalurkan.", ikon: ClipboardList },
  { href: "/donatur/pesan", judul: "Pesan", deskripsi: "Kirim pesan ke mahasiswa binaan (dimoderasi admin).", ikon: MessageCircle },
];

export default async function DashboardDonatur() {
  const session = await auth();

  return (
    <main className="mx-auto mt-6 mb-10 max-w-4xl p-6">
      <HeroDashboard judul="Dashboard Orang Tua Asuh" subjudul={session?.user?.email ?? ""} />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TAUTAN.map((t) => (
          <KartuTautan key={t.href} href={t.href} judul={t.judul} deskripsi={t.deskripsi} ikon={t.ikon} />
        ))}
      </div>
    </main>
  );
}
