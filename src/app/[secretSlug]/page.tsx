import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { FormLoginAdmin } from "./form-login-admin";

// Satu-satunya pintu masuk login admin. Sengaja TIDAK ditautkan dari UI
// publik manapun (lihat src/app/page.tsx) — hanya admin yang tahu URL-nya
// lewat ADMIN_LOGIN_PATH. Ini lapisan obscurity tambahan, bukan pengganti
// RBAC; akses ke /admin/* tetap dijaga middleware + requireRole("ADMIN").
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function HalamanLoginAdminTersembunyi({
  params,
}: {
  params: Promise<{ secretSlug: string }>;
}) {
  const { secretSlug } = await params;
  if (secretSlug !== env.ADMIN_LOGIN_PATH) notFound();

  return <FormLoginAdmin />;
}
