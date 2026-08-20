import Link from "next/link";
import Image from "next/image";
import { ChevronDown, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { TombolKeluar } from "./tombol-keluar";

export interface NavLinkAplikasi {
  href: string;
  label: string;
  ikon?: LucideIcon;
}

export interface NavGroupAplikasi {
  label: string;
  items: NavLinkAplikasi[];
}

const LABEL_ROLE: Record<string, string> = {
  ADMIN: "Admin",
  MAHASISWA: "Mahasiswa",
  ORTU_ASUH: "Orang Tua Asuh",
};

export async function HeaderAplikasi({
  navLinks,
  navGroup,
  beranda,
}: {
  navLinks: NavLinkAplikasi[];
  navGroup?: NavGroupAplikasi;
  beranda: string;
}) {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md shadow-xs">
      <div className="h-1 bg-gradient-to-r from-primary via-[#116e63] to-accent" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link href={beranda} className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/images/logo-uika.png"
              alt="Logo Resmi UIKA Bogor"
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-xs"
              priority
            />
          </div>
          <div>
            <span className="block font-heading text-lg font-bold leading-tight text-primary">
              UIKA Bogor
            </span>
            <span className="block text-xs font-medium text-muted">Beasiswa Orangtua Asuh</span>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-ink/80 transition-all duration-150 hover:bg-primary-light/60 hover:text-primary"
            >
              {l.ikon && <l.ikon className="h-4 w-4 text-primary/70" strokeWidth={1.75} />}
              <span>{l.label}</span>
            </Link>
          ))}
          {navGroup && (
            <details className="group relative">
              <summary className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-ink/80 list-none transition-all duration-150 hover:bg-primary-light/60 hover:text-primary">
                <span>{navGroup.label}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                {navGroup.items.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-primary-light hover:text-primary"
                  >
                    {l.ikon && <l.ikon className="h-4 w-4 text-primary" strokeWidth={1.75} />}
                    <span>{l.label}</span>
                  </Link>
                ))}
              </div>
            </details>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-primary">
              <User className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col text-right leading-tight">
              <span className="max-w-[140px] truncate text-xs font-medium text-ink md:max-w-[200px]">
                {session?.user?.email}
              </span>
              {session?.user && (
                <span className="text-[11px] font-semibold text-accent-dark">
                  {LABEL_ROLE[session.user.role] ?? session.user.role}
                </span>
              )}
            </div>
          </div>
          <TombolKeluar />
        </div>
      </div>
    </header>
  );
}
