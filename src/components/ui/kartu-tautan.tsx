import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function KartuTautan({
  href,
  judul,
  deskripsi,
  ikon: Ikon,
}: {
  href: string;
  judul: string;
  deskripsi: string;
  ikon?: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-primary-light"
    >
      {Ikon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <Ikon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      )}
      <span>
        <span className="block font-heading font-semibold text-ink">{judul}</span>
        <span className="mt-1 block text-sm text-muted">{deskripsi}</span>
      </span>
    </Link>
  );
}
