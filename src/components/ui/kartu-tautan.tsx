import Link from "next/link";

export function KartuTautan({
  href,
  judul,
  deskripsi,
}: {
  href: string;
  judul: string;
  deskripsi: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-primary-light"
    >
      <p className="font-heading font-semibold text-ink">{judul}</p>
      <p className="mt-1 text-sm text-muted">{deskripsi}</p>
    </Link>
  );
}
