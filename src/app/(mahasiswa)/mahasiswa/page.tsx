import { auth } from "@/lib/auth";
import { TombolKeluar } from "@/components/ui/tombol-keluar";

export default async function DashboardMahasiswa() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Dashboard Mahasiswa</h1>
      <p className="text-sm text-gray-600">{session?.user?.email}</p>
      <TombolKeluar />
    </main>
  );
}
