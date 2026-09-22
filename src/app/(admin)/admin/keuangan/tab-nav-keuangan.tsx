"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";

const TABS = [
  { href: "/admin/keuangan/pemasukan", label: "Pemasukan", ikon: ArrowUpCircle, aktifPrefix: "/admin/keuangan/pemasukan" },
  {
    href: "/admin/keuangan/alokasi/simulasi",
    label: "Pengeluaran",
    ikon: ArrowDownCircle,
    // Batch alokasi ada di /admin/keuangan/alokasi/[batchId], bukan cuma
    // /simulasi — prefix lebih luas ini biar tab tetap aktif di halaman itu.
    aktifPrefix: "/admin/keuangan/alokasi",
  },
  { href: "/admin/keuangan/surplus", label: "Surplus", ikon: Scale, aktifPrefix: "/admin/keuangan/surplus" },
];

function cocokAktif(pathname: string, aktifPrefix: string): boolean {
  return pathname === aktifPrefix || pathname.startsWith(`${aktifPrefix}/`);
}

export function TabNavKeuangan() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-surface p-1.5 shadow-2xs">
      {TABS.map((tab) => {
        const Icon = tab.ikon;
        const aktif = cocokAktif(pathname, tab.aktifPrefix);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
              aktif
                ? "bg-primary text-white shadow-xs"
                : "text-muted hover:bg-surface-alt/70 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
