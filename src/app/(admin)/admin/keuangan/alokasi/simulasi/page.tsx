import { ambilPeriodeUntukAlokasi } from "@/server/queries/alokasi";
import { ShieldAlert } from "lucide-react";
import { FormSimulasi } from "./form-simulasi";

export default async function HalamanSimulasiAlokasi() {
  const periodeList = await ambilPeriodeUntukAlokasi();

  return (
    <div>
      {/* Info Mekanisme 4-Eyes Principle */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 text-xs text-ink shadow-xs">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="leading-relaxed">
          <p className="font-bold text-primary-dark">Prinsip Keamanan Alokasi (Four-Eyes Principle):</p>
          <p className="mt-0.5 text-muted">
            Simulasi bersifat <em>read-only</em> dan tidak mengubah data apa pun. Eksekusi alokasi akan membuat <em>Batch Draft</em> yang <strong>wajib disetujui oleh verifikator/admin lain</strong> sebelum saldo tagihan mahasiswa resmi terpotong.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <FormSimulasi periodeList={periodeList} />
      </div>
    </div>
  );
}
