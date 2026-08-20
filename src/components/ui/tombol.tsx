import type { ComponentProps } from "react";

type VarianTombol = "primer" | "aksen" | "garis" | "bahaya" | "tautan";

const KELAS_VARIAN: Record<VarianTombol, string> = {
  primer: "bg-primary text-white hover:bg-primary-dark",
  aksen: "bg-accent text-ink hover:bg-accent-dark",
  garis: "border border-border text-ink hover:bg-surface-alt",
  bahaya: "border border-red-600 text-red-600 hover:bg-red-50",
  tautan: "text-primary underline hover:text-primary-dark",
};

const KELAS_DASAR =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function Tombol({
  variant = "primer",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: VarianTombol }) {
  const kelasTautan = variant === "tautan" ? "px-0 py-0" : "";
  return (
    <button
      className={`${KELAS_DASAR} ${KELAS_VARIAN[variant]} ${kelasTautan} ${className}`.trim()}
      {...props}
    />
  );
}
