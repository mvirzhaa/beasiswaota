import { FileText, Receipt, ClipboardList, Users, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { HeroDashboard } from "@/components/ui/hero-dashboard";
import { KartuTautan } from "@/components/ui/kartu-tautan";
import { ambilPeringatanLaporan } from "@/server/queries/laporan-perkembangan";

const TAUTAN = [
  { href: "/mahasiswa/pengajuan", judul: "Pengajuan Beasiswa", deskripsi: "Ajukan atau lihat status pengajuan Anda.", ikon: FileText },
  { href: "/mahasiswa/tagihan", judul: "Tagihan", deskripsi: "Sisa tagihan dan riwayat bantuan yang diterima.", ikon: Receipt },
  { href: "/mahasiswa/laporan", judul: "Laporan Perkembangan", deskripsi: "Kirim laporan perkembangan tiap periode.", ikon: ClipboardList },
  { href: "/mahasiswa/pembinaan", judul: "Pembinaan", deskripsi: "Setujui atau tolak pemantauan dari orang tua asuh.", ikon: Users },
  { href: "/mahasiswa/pesan", judul: "Pesan", deskripsi: "Kirim pesan ke pembina (dimoderasi admin).", ikon: MessageCircle },
];

export default async function DashboardMahasiswa() {
  const session = await auth();
  const peringatan = await ambilPeringatanLaporan(session!.user.id);

  return (
    <main className="mx-auto mt-6 mb-10 max-w-4xl p-6">
      <HeroDashboard judul="Dashboard Mahasiswa" subjudul={session?.user?.email ?? ""} />

      {peringatan.perluDiingatkan && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Laporan perkembangan periode {peringatan.periodeBelumLaporan} belum diverifikasi, dan
          periode berikutnya sudah dibuka. Ini syarat perpanjangan beasiswa — segera lengkapi di
          halaman Laporan.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TAUTAN.map((t) => (
          <KartuTautan key={t.href} href={t.href} judul={t.judul} deskripsi={t.deskripsi} ikon={t.ikon} />
        ))}
      </div>
    </main>
  );
}
