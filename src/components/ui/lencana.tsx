import type { ReactNode } from "react";

type NadaLencana = "sukses" | "peringatan" | "bahaya" | "info" | "netral";

const KELAS_NADA: Record<NadaLencana, string> = {
  sukses: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  peringatan: "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-600/30",
  bahaya: "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-600/20",
  info: "bg-primary-light text-primary-dark ring-1 ring-inset ring-primary/20",
  netral: "bg-surface-alt text-muted ring-1 ring-inset ring-border",
};

const KELAS_DOT: Record<NadaLencana, string> = {
  sukses: "bg-emerald-600",
  peringatan: "bg-amber-600",
  bahaya: "bg-rose-600",
  info: "bg-primary",
  netral: "bg-muted",
};

export function Lencana({
  nada = "netral",
  children,
  className = "",
}: {
  nada?: NadaLencana;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${KELAS_NADA[nada]} ${className}`.trim()}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${KELAS_DOT[nada]} opacity-80`} />
      {children}
    </span>
  );
}
