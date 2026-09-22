import { ambilPeriodeUntukAlokasi } from "@/server/queries/alokasi";
import {
  ambilPengeluaranLainTerbaru,
  ambilPeriodeUntukPengeluaranLain,
} from "@/server/queries/pengeluaran-lain";
import { ShieldAlert, Shuffle } from "lucide-react";
import { FormSimulasi } from "./form-simulasi";
import { TabelPengeluaran } from "./tabel-pengeluaran";

export default async function HalamanSimulasiAlokasi() {
  const [periodeList, periodeListPengeluaran, pengeluaranLainList] = await Promise.all([
    ambilPeriodeUntukAlokasi(),
    ambilPeriodeUntukPengeluaranLain(),
    ambilPengeluaranLainTerbaru(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tampilan Tabel Utama Pengeluaran */}
      <section>
        <TabelPengeluaran
          daftar={pengeluaranLainList}
          periodeList={periodeListPengeluaran}
        />
      </section>

      {/* Mesin Alokasi Penyaluran Beasiswa (Simulasi & Eksekusi) */}
      <details className="group rounded-2xl border border-border bg-surface p-5 shadow-2xs">
        <summary className="flex cursor-pointer items-center justify-between font-heading text-sm font-bold text-ink list-none select-none">
          <div className="flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-primary" />
            <span>Simulasi &amp; Eksekusi Alokasi Beasiswa Mahasiswa</span>
          </div>
          <span className="text-xs font-normal text-muted group-open:rotate-180 transition-transform duration-200">
            ▼
          </span>
        </summary>

        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-5">
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

          <FormSimulasi periodeList={periodeList} />
        </div>
      </details>
    </div>
  );
}

