import {
  LayoutDashboard,
  FileText,
  Receipt,
  ClipboardList,
  Users,
  MessageCircle,
} from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { HeaderAplikasi, type NavLinkAplikasi } from "@/components/ui/header-aplikasi";
import { FooterProgram } from "@/components/ui/footer-program";

const NAV_LINKS: NavLinkAplikasi[] = [
  { href: "/mahasiswa", label: "Dashboard", ikon: LayoutDashboard },
  { href: "/mahasiswa/pengajuan", label: "Pengajuan", ikon: FileText },
  { href: "/mahasiswa/tagihan", label: "Tagihan", ikon: Receipt },
  { href: "/mahasiswa/laporan", label: "Laporan", ikon: ClipboardList },
  { href: "/mahasiswa/pembinaan", label: "Pembinaan", ikon: Users },
  { href: "/mahasiswa/pesan", label: "Pesan", ikon: MessageCircle },
];

export default async function LayoutMahasiswa({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("MAHASISWA");
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <HeaderAplikasi navLinks={NAV_LINKS} beranda="/mahasiswa" />
      <div className="flex-1">{children}</div>
      <FooterProgram />
    </div>
  );
}
