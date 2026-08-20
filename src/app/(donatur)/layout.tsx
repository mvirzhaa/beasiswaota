import {
  LayoutDashboard,
  HandCoins,
  Wallet,
  Users,
  ClipboardList,
  MessageCircle,
} from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { HeaderAplikasi, type NavLinkAplikasi } from "@/components/ui/header-aplikasi";
import { FooterProgram } from "@/components/ui/footer-program";

const NAV_LINKS: NavLinkAplikasi[] = [
  { href: "/donatur", label: "Dashboard", ikon: LayoutDashboard },
  { href: "/donatur/komitmen", label: "Komitmen", ikon: HandCoins },
  { href: "/donatur/pembayaran", label: "Pembayaran", ikon: Wallet },
  { href: "/donatur/binaan", label: "Binaan", ikon: Users },
  { href: "/donatur/laporan", label: "Laporan", ikon: ClipboardList },
  { href: "/donatur/pesan", label: "Pesan", ikon: MessageCircle },
];

export default async function LayoutDonatur({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ORTU_ASUH");
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <HeaderAplikasi navLinks={NAV_LINKS} beranda="/donatur" />
      <div className="flex-1">{children}</div>
      <FooterProgram />
    </div>
  );
}
