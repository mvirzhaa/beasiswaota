import {
  FileText,
  Receipt,
  HandCoins,
  Shuffle,
  Wallet,
  Users,
  Activity,
  ClipboardList,
  MessageCircle,
  UserCog,
  Settings,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { HeroDashboard } from "@/components/ui/hero-dashboard";
import { KartuTautan } from "@/components/ui/kartu-tautan";

const KELOMPOK = [
  {
    judul: "Operasional",
    tautan: [
      { href: "/admin/pengajuan", judul: "Pengajuan", deskripsi: "Verifikasi berkas dan skor pengajuan mahasiswa.", ikon: FileText },
      { href: "/admin/transaksi", judul: "Transaksi", deskripsi: "Verifikasi bukti transfer yang masuk.", ikon: Receipt },
      { href: "/admin/komitmen", judul: "Komitmen", deskripsi: "Konfirmasi komitmen donasi baru dari donatur.", ikon: HandCoins },
      { href: "/admin/alokasi/simulasi", judul: "Alokasi", deskripsi: "Simulasikan dan jalankan mesin alokasi dana.", ikon: Shuffle },
      { href: "/admin/potong-gaji", judul: "Potong Gaji", deskripsi: "Ekspor dan impor realisasi potong gaji.", ikon: Wallet },
    ],
  },
  {
    judul: "Pembinaan & Laporan",
    tautan: [
      { href: "/admin/pembinaan", judul: "Pembinaan", deskripsi: "Tugaskan relasi asuh donatur ↔ mahasiswa.", ikon: Users },
      { href: "/admin/monitoring", judul: "Monitoring", deskripsi: "Pantau tingkat risiko akademik penerima aktif.", ikon: Activity },
      { href: "/admin/laporan", judul: "Laporan Perkembangan", deskripsi: "Review laporan perkembangan mahasiswa.", ikon: ClipboardList },
      { href: "/admin/pesan", judul: "Pesan", deskripsi: "Moderasi pesan antara donatur dan mahasiswa binaan.", ikon: MessageCircle },
    ],
  },
  {
    judul: "Sistem",
    tautan: [
      { href: "/admin/akun", judul: "Kelola Akun", deskripsi: "Verifikasi akun baru, daftarkan mahasiswa langsung.", ikon: UserCog },
      { href: "/admin/pengaturan", judul: "Pengaturan", deskripsi: "Atur flag dan parameter sistem.", ikon: Settings },
    ],
  },
];

export default async function DashboardAdmin() {
  const session = await auth();

  return (
    <main className="mx-auto mt-6 mb-10 max-w-5xl p-6">
      <HeroDashboard judul="Dashboard Admin" subjudul={session?.user?.email ?? ""} />

      <div className="mt-8 flex flex-col gap-8">
        {KELOMPOK.map((k) => (
          <section key={k.judul}>
            <h2 className="font-heading text-sm font-semibold tracking-wide text-muted uppercase">
              {k.judul}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {k.tautan.map((t) => (
                <KartuTautan key={t.href} href={t.href} judul={t.judul} deskripsi={t.deskripsi} ikon={t.ikon} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
