import { ambilPeriodeUntukAlokasi } from "@/server/queries/alokasi";
import { FormSimulasi } from "./form-simulasi";

export default async function HalamanSimulasiAlokasi() {
  const periodeList = await ambilPeriodeUntukAlokasi();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Simulasi & Eksekusi Alokasi</h1>
      <p className="mt-1 text-sm text-gray-600">
        Simulasi tidak menulis apa pun ke database. Eksekusi menulis batch berstatus DRAFT
        yang masih perlu disetujui admin lain sebelum tagihan berubah.
      </p>

      <FormSimulasi periodeList={periodeList} />
    </main>
  );
}
