import Link from "next/link";
import { auth } from "@/lib/auth";
import { TombolKeluar } from "./tombol-keluar";

export interface NavLinkAplikasi {
  href: string;
  label: string;
}

const LABEL_ROLE: Record<string, string> = {
  ADMIN: "Admin",
  MAHASISWA: "Mahasiswa",
  ORTU_ASUH: "Orang Tua Asuh",
};

export async function HeaderAplikasi({
  navLinks,
  beranda,
}: {
  navLinks: NavLinkAplikasi[];
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
