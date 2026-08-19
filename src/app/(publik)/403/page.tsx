import Link from "next/link";

export default function HalamanTerlarang() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">403 — Akses ditolak</h1>
      <p className="text-sm text-gray-600">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Link href="/" className="text-sm underline">
        Kembali ke beranda
      </Link>
    </main>
  );
}
