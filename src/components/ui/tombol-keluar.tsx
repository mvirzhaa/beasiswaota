import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export function TombolKeluar() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 shadow-2xs"
        title="Keluar dari akun dan kembali ke Beranda"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Keluar</span>
      </button>
    </form>
  );
}
