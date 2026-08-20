import { requireRole } from "@/lib/rbac";
import { HeaderAplikasi, type NavLinkAplikasi } from "@/components/ui/header-aplikasi";

const NAV_LINKS: NavLinkAplikasi[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pengajuan", label: "Pengajuan" },
  { href: "/admin/komitmen", label: "Komitmen" },
  { href: "/admin/transaksi", label: "Transaksi" },
  { href: "/admin/alokasi/simulasi", label: "Alokasi" },
  { href: "/admin/potong-gaji", label: "Potong Gaji" },
  { href: "/admin/pembinaan", label: "Pembinaan" },
  { href: "/admin/monitoring", label: "Monitoring" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/pesan", label: "Pesan" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <div className="min-h-screen bg-surface-alt">
      <HeaderAplikasi navLinks={NAV_LINKS} beranda="/admin" />
      {children}
    </div>
  );
}
