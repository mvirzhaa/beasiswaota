import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dibutuhkan Dockerfile multi-stage di deploy/ (Sesi 10) — menghasilkan
  // build mandiri berisi hanya file yang benar-benar dipakai saat runtime,
  // tanpa perlu node_modules penuh di image produksi.
  output: "standalone",
  serverExternalPackages: ["argon2"],
  async redirects() {
    return [
      { source: "/admin/transaksi", destination: "/admin/keuangan/transaksi", permanent: false },
      { source: "/admin/transaksi/:id", destination: "/admin/keuangan/transaksi/:id", permanent: false },
      { source: "/admin/komitmen", destination: "/admin/keuangan/komitmen", permanent: false },
      { source: "/admin/alokasi", destination: "/admin/keuangan/alokasi/simulasi", permanent: false },
      { source: "/admin/alokasi/:path*", destination: "/admin/keuangan/alokasi/:path*", permanent: false },
      { source: "/admin/pengajuan", destination: "/admin/mahasiswa", permanent: false },
      { source: "/admin/monitoring", destination: "/admin/laporan", permanent: false },
    ];
  },
};

export default nextConfig;
