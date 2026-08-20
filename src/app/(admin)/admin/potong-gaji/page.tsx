import { formatRupiah } from "@/lib/uang";
import { ambilDaftarPotonganBulanBerjalan } from "@/server/queries/potong-gaji";
import { FormImporRealisasi } from "./form-impor-realisasi";

export default async function HalamanPotongGajiAdmin() {
  const daftar = await ambilDaftarPotonganBulanBerjalan();
  const total = daftar.reduce((acc, j) => acc + j.nominal, 0n);

  return (
    <main className="mx-auto max-w-4xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Potong Gaji</h1>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-bold text-ink">Potongan bulan berjalan ({daftar.length})</h2>
        <p className="mt-1 text-sm text-muted">Total: {formatRupiah(total)}</p>
        <a
          href="/api/admin/potong-gaji/ekspor"
          className="mt-2 inline-block rounded-lg border border-border px-3 py-1 text-sm"
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
                <td colSpan={5} className="py-4 text-center text-muted">
                  Tidak ada potongan bulan ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-ink">Impor realisasi</h2>
        <p className="mt-1 text-sm text-muted">
          Kolom: JadwalBayarId, NIP, Nominal Realisasi, Tanggal Realisasi. Baris pertama header.
        </p>
        <FormImporRealisasi />
      </section>
    </main>
  );
}
