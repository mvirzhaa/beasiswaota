import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dibutuhkan Dockerfile multi-stage di deploy/ (Sesi 10) — menghasilkan
  // build mandiri berisi hanya file yang benar-benar dipakai saat runtime,
  // tanpa perlu node_modules penuh di image produksi.
  output: "standalone",
};

export default nextConfig;
