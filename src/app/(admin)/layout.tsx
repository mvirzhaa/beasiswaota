import { requireRole } from "@/lib/rbac";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return <>{children}</>;
}
