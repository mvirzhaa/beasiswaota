import { requireRole } from "@/lib/rbac";

export default async function LayoutDonatur({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ORTU_ASUH");
  return <>{children}</>;
}
