import { ArrowLeftRight } from "lucide-react";
import { TabNavKeuangan } from "./tab-nav-keuangan";

export default function LayoutKeuangan({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-6 pb-7 sm:px-8">
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          <span>Pemasukan &amp; Pengeluaran</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">Arus Kas &amp; Penyaluran Dana</h1>
        <p className="text-sm text-muted">
          Satu tempat untuk memantau dana masuk, komitmen donatur, penyaluran ke mahasiswa, dan potong gaji.
        </p>
      </div>

      <div className="mt-4">
        <TabNavKeuangan />
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}
