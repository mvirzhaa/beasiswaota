import {
  LayoutDashboard,
  FileText,
  Receipt,
  Shuffle,
  Activity,
  HandCoins,
  Wallet,
  Users,
  ClipboardList,
  MessageCircle,
  UserCog,
  Settings,
} from "lucide-react";
import { requireRole } from "@/lib/rbac";
import {
  HeaderAplikasi,
  type NavLinkAplikasi,
  type NavGroupAplikasi,
} from "@/components/ui/header-aplikasi";
import { FooterProgram } from "@/components/ui/footer-program";

const NAV_LINKS: NavLinkAplikasi[] = [
  { href: "/admin", label: "Dashboard", ikon: LayoutDashboard },
  { href: "/admin/pengajuan", label: "Pengajuan", ikon: FileText },
  { href: "/admin/transaksi", label: "Transaksi", ikon: Receipt },
  { href: "/admin/alokasi/simulasi", label: "Alokasi", ikon: Shuffle },
  { href: "/admin/monitoring", label: "Monitoring", ikon: Activity },
];

const NAV_GROUP: NavGroupAplikasi = {
  label: "Lainnya",
  items: [
    { href: "/admin/komitmen", label: "Komitmen", ikon: HandCoins },
    { href: "/admin/potong-gaji", label: "Potong Gaji", ikon: Wallet },
    { href: "/admin/pembinaan", label: "Pembinaan", ikon: Users },
    { href: "/admin/laporan", label: "Laporan Perkembangan", ikon: ClipboardList },
    { href: "/admin/pesan", label: "Pesan", ikon: MessageCircle },
    { href: "/admin/akun", label: "Kelola Akun", ikon: UserCog },
    { href: "/admin/pengaturan", label: "Pengaturan", ikon: Settings },
  ],
};

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <HeaderAplikasi navLinks={NAV_LINKS} navGroup={NAV_GROUP} beranda="/admin" />
      <div className="flex-1">{children}</div>
      <FooterProgram />
    </div>
  );
}
