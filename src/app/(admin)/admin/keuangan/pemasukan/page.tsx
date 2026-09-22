import { Receipt, HandCoins } from "lucide-react";
import HalamanTransaksiAdmin from "../transaksi/page";
import HalamanKomitmenAdmin from "../komitmen/page";

// Tab "Pemasukan" = komposisi dua halaman yang sudah ada (transaksi & komitmen),
// BUKAN duplikasi query/action-nya — reuse langsung komponen halaman di
// ../transaksi/page dan ../komitmen/page supaya logika maker-checker yang
// sudah ada (verifikasi transaksi, konfirmasi komitmen) tidak ditulis ulang.
// Masing-masing tetap reachable sebagai rute berdiri sendiri untuk deep-link
// filter status (link "Review" dsb mengarah ke sana).
export default async function HalamanPemasukanKeuangan() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-base font-bold text-ink">Transaksi Masuk</h2>
        </div>
        <HalamanTransaksiAdmin searchParams={Promise.resolve({})} />
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <HandCoins className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-base font-bold text-ink">Komitmen Donatur</h2>
        </div>
        <HalamanKomitmenAdmin searchParams={Promise.resolve({})} />
      </section>
    </div>
  );
}
