import Link from "next/link";
import { auth } from "@/lib/auth";
import { TombolKeluar } from "./tombol-keluar";

export interface NavLinkAplikasi {
  href: string;
  label: string;
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
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href={beranda} className="flex items-center gap-2">
          <span className="font-heading text-lg font-bold text-primary">UIKA</span>
          <span className="hidden text-xs text-muted sm:inline">Beasiswa Orangtua Asuh</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink hover:text-primary">
              {l.label}
            </Link>
          ))}
          {navGroup && (
            <details className="group relative">
              <summary className="cursor-pointer text-ink marker:text-muted hover:text-primary">
                {navGroup.label}
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-52 rounded-lg border border-border bg-surface py-1 shadow-[0_0_15px_rgba(0,0,0,0.12)]">
                {navGroup.items.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block px-3 py-2 text-ink hover:bg-surface-alt hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted md:inline">{session?.user?.email}</span>
          {session?.user && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-ink">
              {LABEL_ROLE[session.user.role] ?? session.user.role}
            </span>
          )}
          <TombolKeluar />
        </div>
      </div>
    </header>
  );
}
