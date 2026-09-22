"use client";

import { useState, type ReactNode } from "react";
import { HandCoins, Receipt, Users } from "lucide-react";

interface TabDetailOrtuAsuhProps {
  komitmenNode: ReactNode;
  transaksiNode: ReactNode;
  binaanNode: ReactNode;
  jumlahKomitmen: number;
  jumlahTransaksi: number;
  jumlahBinaan: number;
}

export function TabDetailOrtuAsuh({
  komitmenNode,
  transaksiNode,
  binaanNode,
  jumlahKomitmen,
  jumlahTransaksi,
  jumlahBinaan,
}: TabDetailOrtuAsuhProps) {
  const [tabAktif, setTabAktif] = useState<"komitmen" | "transaksi" | "binaan">("komitmen");

  const tabs = [
    {
      id: "komitmen" as const,
      label: "Komitmen Donasi",
      ikon: HandCoins,
      badge: jumlahKomitmen > 0 ? jumlahKomitmen : null,
    },
    {
      id: "transaksi" as const,
      label: "Riwayat Transaksi",
      ikon: Receipt,
      badge: jumlahTransaksi > 0 ? jumlahTransaksi : null,
    },
    {
      id: "binaan" as const,
      label: "Mahasiswa Binaan",
      ikon: Users,
      badge: jumlahBinaan > 0 ? jumlahBinaan : null,
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
        {tabAktif === "komitmen" && <div>{komitmenNode}</div>}
        {tabAktif === "transaksi" && <div>{transaksiNode}</div>}
        {tabAktif === "binaan" && <div>{binaanNode}</div>}
      </div>
    </div>
  );
}
