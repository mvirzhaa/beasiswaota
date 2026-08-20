import { requireRole } from "@/lib/rbac";
import {
  HeaderAplikasi,
  type NavLinkAplikasi,
  type NavGroupAplikasi,
} from "@/components/ui/header-aplikasi";

const NAV_LINKS: NavLinkAplikasi[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pengajuan", label: "Pengajuan" },
  { href: "/admin/transaksi", label: "Transaksi" },
  { href: "/admin/alokasi/simulasi", label: "Alokasi" },
  { href: "/admin/monitoring", label: "Monitoring" },
];

const NAV_GROUP: NavGroupAplikasi = {
  label: "Lainnya",
  items: [
    { href: "/admin/komitmen", label: "Komitmen" },
    { href: "/admin/potong-gaji", label: "Potong Gaji" },
    { href: "/admin/pembinaan", label: "Pembinaan" },
    { href: "/admin/laporan", label: "Laporan Perkembangan" },
    { href: "/admin/pesan", label: "Pesan" },
    { href: "/admin/akun", label: "Kelola Akun" },
    { href: "/admin/pengaturan", label: "Pengaturan" },
  ],
};

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <div className="min-h-screen bg-surface-alt">
      <HeaderAplikasi navLinks={NAV_LINKS} navGroup={NAV_GROUP} beranda="/admin" />
      {children}
    </div>
  );
}
