import { requireRole } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { SidebarAdmin, type NavGroupSidebar } from "@/components/ui/sidebar-admin";
import { TombolKeluar } from "@/components/ui/tombol-keluar";
import { ambilJumlahTransaksiMenunggu } from "@/server/queries/transaksi";
import { ambilJumlahKomitmenMenunggu } from "@/server/queries/komitmen";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  const session = await auth();

  const [jumlahTransaksi, jumlahKomitmen] = await Promise.all([
    ambilJumlahTransaksiMenunggu(),
    ambilJumlahKomitmenMenunggu(),
  ]);

  const groups: NavGroupSidebar[] = [
    {
      items: [{ href: "/admin", label: "Dashboard", ikon: "dashboard" }],
    },
    {
      label: "Mahasiswa & Donatur",
      items: [
        { href: "/admin/mahasiswa", label: "Kelola Data Mahasiswa", ikon: "mahasiswa" },
        { href: "/admin/orangtua-asuh", label: "Kelola Data Donatur", ikon: "ortuAsuh" },
        { href: "/admin/pembinaan", label: "Pembinaan", ikon: "pembinaan" },
        { href: "/admin/laporan", label: "Laporan Perkembangan", ikon: "laporan" },
      ],
    },
    {
      label: "Keuangan",
      items: [
        {
          href: "/admin/keuangan",
          label: "Pemasukan & Pengeluaran",
          ikon: "keuangan",
          jumlah: jumlahTransaksi + jumlahKomitmen,
        },
        { href: "/admin/potong-gaji", label: "Potong Gaji", ikon: "potongGaji" },
      ],
    },
    {
      label: "Sistem",
      items: [{ href: "/admin/pengaturan", label: "Pengaturan", ikon: "pengaturan" }],
    },
  ];

  return (
    <div className="flex min-h-screen bg-surface-alt">
      <SidebarAdmin
        groups={groups}
        emailAdmin={session?.user?.email ?? "admin"}
        tombolKeluar={<TombolKeluar />}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
