"use client";

import { useState, type ReactNode } from "react";
import { ClipboardList, Wallet, HandCoins } from "lucide-react";

interface TabDetailMahasiswaProps {
  laporanNode: ReactNode;
  tagihanNode: ReactNode;
  bantuanNode: ReactNode;
  jumlahTagihan: number;
  jumlahBantuan: number;
}

export function TabDetailMahasiswa({
  laporanNode,
  tagihanNode,
  bantuanNode,
  jumlahTagihan,
  jumlahBantuan,
}: TabDetailMahasiswaProps) {
  const [tabAktif, setTabAktif] = useState<"laporan" | "tagihan" | "bantuan">("laporan");

  const tabs = [
    {
      id: "laporan" as const,
      label: "Laporan Perkembangan",
      ikon: ClipboardList,
      badge: null,
    },
    {
      id: "tagihan" as const,
      label: "Tagihan UKT",
      ikon: Wallet,
      badge: jumlahTagihan > 0 ? jumlahTagihan : null,
    },
    {
      id: "bantuan" as const,
      label: "Riwayat Bantuan",
      ikon: HandCoins,
      badge: jumlahBantuan > 0 ? jumlahBantuan : null,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation Header */}
      <div className="flex border-b border-border bg-surface rounded-2xl p-1.5 shadow-2xs">
        <div className="flex flex-wrap gap-1.5 w-full">
          {tabs.map((tab) => {
            const Icon = tab.ikon;
            const aktif = tabAktif === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabAktif(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  aktif
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted hover:text-ink hover:bg-surface-alt/70"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      aktif ? "bg-white/20 text-white" : "bg-surface-alt text-muted"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {tabAktif === "laporan" && <div>{laporanNode}</div>}
        {tabAktif === "tagihan" && <div>{tagihanNode}</div>}
        {tabAktif === "bantuan" && <div>{bantuanNode}</div>}
      </div>
    </div>
  );
}
