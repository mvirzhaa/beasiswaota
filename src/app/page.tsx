import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const TUJUAN_PER_ROLE: Record<string, string> = {
  MAHASISWA: "/mahasiswa",
  ORTU_ASUH: "/donatur",
  ADMIN: "/admin",
};

export default async function Beranda() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(TUJUAN_PER_ROLE[session.user.role] ?? "/login");
}
