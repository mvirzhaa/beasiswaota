import { formatRupiah } from "@/lib/uang";
import { ambilDaftarPotonganBulanBerjalan } from "@/server/queries/potong-gaji";
import { FormImporRealisasi } from "./form-impor-realisasi";

export default async function HalamanPotongGajiAdmin() {
  const daftar = await ambilDaftarPotonganBulanBerjalan();
  const total = daftar.reduce((acc, j) => acc + j.nominal, 0n);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">Potong Gaji</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Potongan bulan berjalan ({daftar.length})</h2>
        <p className="mt-1 text-sm text-gray-600">Total: {formatRupiah(total)}</p>
        <a
          href="/api/admin/potong-gaji/ekspor"
          className="mt-2 inline-block rounded border px-3 py-1 text-sm"
        >
          Ekspor XLSX untuk payroll
        </a>

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">NIP</th>
              <th>Donatur</th>
              <th>Periode</th>
              <th>Nominal</th>
              <th>Jatuh tempo</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((j) => (
              <tr key={j.id} className="border-b">
                <td className="py-2">{j.komitmen.ortuAsuh.nip ?? "-"}</td>
                <td>{j.komitmen.ortuAsuh.atasNamaMunfiq || j.komitmen.ortuAsuh.nama}</td>
                <td>{j.periode.kode}</td>
                <td>{formatRupiah(j.nominal)}</td>
                <td>{j.jatuhTempo.toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  Tidak ada potongan bulan ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Impor realisasi</h2>
        <p className="mt-1 text-sm text-gray-600">
          Kolom: JadwalBayarId, NIP, Nominal Realisasi, Tanggal Realisasi. Baris pertama header.
        </p>
        <FormImporRealisasi />
      </section>
    </main>
  );
}
