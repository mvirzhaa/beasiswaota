import { signOut } from "@/lib/auth";

export function TombolKeluar() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button type="submit" className="text-sm underline">
        Keluar
      </button>
    </form>
  );
}
