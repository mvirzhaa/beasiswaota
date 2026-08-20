import type { ReactNode } from "react";

type NadaLencana = "sukses" | "peringatan" | "bahaya" | "info" | "netral";

const KELAS_NADA: Record<NadaLencana, string> = {
  sukses: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  peringatan: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  bahaya: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  info: "bg-primary-light text-primary-dark ring-1 ring-inset ring-primary/20",
  netral: "bg-surface-alt text-muted ring-1 ring-inset ring-border",
};

export function Lencana({ nada = "netral", children }: { nada?: NadaLencana; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${KELAS_NADA[nada]}`}
    >
      {children}
    </span>
  );
}
