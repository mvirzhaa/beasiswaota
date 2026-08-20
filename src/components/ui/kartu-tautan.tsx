import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
      className="group relative flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
    >
      {Ikon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-white group-hover:scale-105 shadow-xs">
          <Ikon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      )}
      <div className="flex-1 pr-6">
        <span className="block font-heading text-base font-bold text-ink transition-colors group-hover:text-primary">
          {judul}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted">{deskripsi}</span>
      </div>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary">
        <ChevronRight className="h-5 w-5" strokeWidth={2} />
      </span>
    </Link>
  );
}
