"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  HeartHandshake,
  Users,
  ClipboardList,
  ArrowLeftRight,
  Wallet,
  Settings,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

// Ikon HARUS dipetakan di sini (Client Component), bukan diteruskan sebagai
// prop dari Server Component — referensi komponen Lucide (forwardRef object)
// tidak bisa diserialisasi lewat batas RSC ("Only plain objects can be
// passed to Client Components from Server Components").
const PETA_IKON = {
  dashboard: LayoutDashboard,
  mahasiswa: GraduationCap,
  ortuAsuh: HeartHandshake,
  pembinaan: Users,
  laporan: ClipboardList,
  keuangan: ArrowLeftRight,
  potongGaji: Wallet,
  pengaturan: Settings,
} satisfies Record<string, LucideIcon>;

export type KunciIkonSidebar = keyof typeof PETA_IKON;

export interface NavItemSidebar {
  href: string;
  label: string;
  ikon: KunciIkonSidebar;
  jumlah?: number;
}

export interface NavGroupSidebar {
  label?: string;
  items: NavItemSidebar[];
}

function cocokAktif(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarAdmin({
  groups,
  emailAdmin,
  tombolKeluar,
}: {
  groups: NavGroupSidebar[];
  emailAdmin: string;
  tombolKeluar: ReactNode;
}) {
  const pathname = usePathname();
  const inisial = emailAdmin.slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface sticky top-0">
      <Link href="/admin" className="flex items-center gap-2.5 border-b border-border px-5 py-[22px]">
        <Image
          src="/images/logo-uika.png"
          alt="Logo UIKA"
          width={38}
          height={38}
          className="h-[38px] w-[38px] shrink-0 object-contain"
        />
        <div className="min-w-0">
          <div className="truncate font-heading text-sm font-bold leading-tight text-ink">
            Beasiswa OTA
          </div>
          <div className="text-[11px] leading-tight text-muted">UIKA Bogor</div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((grup, i) => (
          <div key={grup.label ?? i} className="mb-5">
            {grup.label && (
              <div className="mb-2 px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                {grup.label}
              </div>
            )}
            {grup.items.map((item) => {
              const Icon = PETA_IKON[item.ikon];
              const aktif = cocokAktif(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors ${
                    aktif
                      ? "bg-primary-light font-bold text-primary-dark"
                      : "text-ink hover:bg-surface-alt"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${aktif ? "text-primary" : "text-muted"}`} strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                  {!!item.jumlah && item.jumlah > 0 && (
                    <span className="ml-auto rounded-full bg-accent px-1.5 py-px text-[10.5px] font-bold text-ink">
                      {item.jumlah}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-2.5">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-light/50 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-light hover:text-primary-dark"
          title="Buka tampilan landing page & pendaftaran publik di tab baru"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Lihat Website Publik</span>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 border-t border-border px-4 py-3.5">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-bold text-white">
          {inisial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-ink">Admin Pengelola</div>
          <div className="truncate text-[11px] text-muted">{emailAdmin}</div>
        </div>
        {tombolKeluar}
      </div>
    </aside>
  );
}
