import { ambilPeriodeUntukAlokasi } from "@/server/queries/alokasi";
import { FormSimulasi } from "./form-simulasi";

export default async function HalamanSimulasiAlokasi() {
  const periodeList = await ambilPeriodeUntukAlokasi();

  return (
    <main className="mx-auto max-w-3xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Simulasi & Eksekusi Alokasi</h1>
      <p className="mt-1 text-sm text-muted">
        Simulasi tidak menulis apa pun ke database. Eksekusi menulis batch berstatus DRAFT
        yang masih perlu disetujui admin lain sebelum tagihan berubah.
      </p>

      <FormSimulasi periodeList={periodeList} />
    </main>
  );
}
