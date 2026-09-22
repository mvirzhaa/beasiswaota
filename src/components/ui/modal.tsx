"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  buka: boolean;
  onTutup: () => void;
  judul: string;
  deskripsi?: string;
  children: ReactNode;
  ukuran?: "sm" | "md" | "lg" | "xl";
}

const KELAS_UKURAN: Record<NonNullable<ModalProps["ukuran"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  buka,
  onTutup,
  judul,
  deskripsi,
  children,
  ukuran = "md",
}: ModalProps) {
  useEffect(() => {
    if (!buka) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onTutup();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [buka, onTutup]);

  if (!buka) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onTutup}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      />

      {/* Konten Modal */}
      <div
        className={`relative w-full ${KELAS_UKURAN[ukuran]} z-10 max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 animate-in zoom-in-95`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/80 pb-4">
          <div className="min-w-0 flex-1">
            <h2 id="modal-title" className="font-heading text-lg font-bold text-ink">
              {judul}
            </h2>
            {deskripsi && <p className="mt-1 text-xs text-muted leading-relaxed">{deskripsi}</p>}
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup dialog"
            className="shrink-0 rounded-xl p-1.5 text-muted transition-colors hover:bg-surface-alt hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
