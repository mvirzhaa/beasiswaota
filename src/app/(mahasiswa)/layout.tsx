import { requireRole } from "@/lib/rbac";

export default async function LayoutMahasiswa({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("MAHASISWA");
  return <>{children}</>;
}
