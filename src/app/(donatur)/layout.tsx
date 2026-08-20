import { requireRole } from "@/lib/rbac";
import { HeaderAplikasi, type NavLinkAplikasi } from "@/components/ui/header-aplikasi";

const NAV_LINKS: NavLinkAplikasi[] = [
  { href: "/donatur", label: "Dashboard" },
  { href: "/donatur/komitmen", label: "Komitmen" },
  { href: "/donatur/pembayaran", label: "Pembayaran" },
  { href: "/donatur/binaan", label: "Binaan" },
  { href: "/donatur/laporan", label: "Laporan" },
  { href: "/donatur/pesan", label: "Pesan" },
];

export default async function LayoutDonatur({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ORTU_ASUH");
  return (
    <div className="min-h-screen bg-surface-alt">
      <HeaderAplikasi navLinks={NAV_LINKS} beranda="/donatur" />
      {children}
    </div>
  );
}
