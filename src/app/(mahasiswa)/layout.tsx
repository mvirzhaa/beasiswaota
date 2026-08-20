import { requireRole } from "@/lib/rbac";
import { HeaderAplikasi, type NavLinkAplikasi } from "@/components/ui/header-aplikasi";

const NAV_LINKS: NavLinkAplikasi[] = [
  { href: "/mahasiswa", label: "Dashboard" },
  { href: "/mahasiswa/pengajuan", label: "Pengajuan" },
  { href: "/mahasiswa/tagihan", label: "Tagihan" },
  { href: "/mahasiswa/laporan", label: "Laporan" },
  { href: "/mahasiswa/pembinaan", label: "Pembinaan" },
  { href: "/mahasiswa/pesan", label: "Pesan" },
];

export default async function LayoutMahasiswa({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("MAHASISWA");
  return (
    <div className="min-h-screen bg-surface-alt">
      <HeaderAplikasi navLinks={NAV_LINKS} beranda="/mahasiswa" />
      {children}
    </div>
  );
}
