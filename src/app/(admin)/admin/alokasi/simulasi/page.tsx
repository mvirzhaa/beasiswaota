import { ambilPeriodeUntukAlokasi } from "@/server/queries/alokasi";
import { Shuffle, ShieldAlert } from "lucide-react";
import { FormSimulasi } from "./form-simulasi";

export default async function HalamanSimulasiAlokasi() {
  const periodeList = await ambilPeriodeUntukAlokasi();

  return (
    <main className="mx-auto mt-6 mb-12 max-w-6xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <Shuffle className="h-4 w-4 text-primary" />
          <span>Algoritma Penyaluran Dana</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Simulasi & Eksekusi Mesin Alokasi
        </h1>
        <p className="text-sm text-muted">
          Penyaluran dana donasi terpusat untuk memotong tagihan UKT mahasiswa berdasarkan skor kebutuhan ekonomi tertinggi.
        </p>
      </div>

      {/* Info Mekanisme 4-Eyes Principle */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 text-xs text-ink shadow-xs">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="leading-relaxed">
          <p className="font-bold text-primary-dark">Prinsip Keamanan Alokasi (Four-Eyes Principle):</p>
          <p className="mt-0.5 text-muted">
            Simulasi bersifat <em>read-only</em> dan tidak mengubah data apa pun. Eksekusi alokasi akan membuat <em>Batch Draft</em> yang <strong>wajib disetujui oleh verifikator/admin lain</strong> sebelum saldo tagihan mahasiswa resmi terpotong.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <FormSimulasi periodeList={periodeList} />
      </div>
    </main>
  );
}
