import Link from "next/link";
import { FooterProgram } from "@/components/ui/footer-program";

export default function HalamanTerlarang() {
  return (
    <main className="flex min-h-screen flex-col bg-surface-alt">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-ink">403 — Akses ditolak</h1>
        <p className="text-sm text-muted">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link href="/" className="text-sm text-primary underline hover:text-primary-dark">
          Kembali ke beranda
        </Link>
      </div>
      <FooterProgram />
    </main>
  );
}
