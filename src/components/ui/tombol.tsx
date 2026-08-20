import type { ComponentProps } from "react";

type VarianTombol = "primer" | "aksen" | "garis" | "bahaya" | "tautan";
type UkuranTombol = "sm" | "md" | "lg";

const KELAS_VARIAN: Record<VarianTombol, string> = {
  primer: "bg-primary text-white hover:bg-primary-dark shadow-xs hover:shadow-sm active:scale-[0.99]",
  aksen: "bg-accent text-ink font-semibold hover:bg-accent-dark shadow-xs hover:shadow-sm active:scale-[0.99]",
  garis: "border border-border bg-surface text-ink hover:bg-surface-alt hover:border-primary/40 active:scale-[0.99]",
  bahaya: "border border-red-300 bg-red-50/60 text-red-700 hover:bg-red-100 hover:border-red-400 active:scale-[0.99]",
  tautan: "text-primary underline-offset-4 hover:underline hover:text-primary-dark",
};

const KELAS_UKURAN: Record<UkuranTombol, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-2.5 text-base rounded-lg",
};

const KELAS_DASAR =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

export function Tombol({
  variant = "primer",
  ukuran = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: VarianTombol; ukuran?: UkuranTombol }) {
  const kelasTautan = variant === "tautan" ? "px-0 py-0" : KELAS_UKURAN[ukuran];
  return (
    <button
      className={`${KELAS_DASAR} ${KELAS_VARIAN[variant]} ${kelasTautan} ${className}`.trim()}
      {...props}
    />
  );
}
