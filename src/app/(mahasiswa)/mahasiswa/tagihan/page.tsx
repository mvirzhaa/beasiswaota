import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import { ambilTagihanMahasiswa, ambilRiwayatBantuanMahasiswa } from "@/server/queries/tagihan";

const LABEL_STATUS: Record<string, string> = {
  BELUM_LUNAS: "Belum lunas",
  LUNAS_SEBAGIAN: "Lunas sebagian",
  LUNAS: "Lunas",
  DIBATALKAN: "Dibatalkan",
};

export default async function HalamanTagihanMahasiswa() {
  const session = await auth();
  const userId = session!.user.id;

  const [tagihan, riwayat] = await Promise.all([
    ambilTagihanMahasiswa(userId),
    ambilRiwayatBantuanMahasiswa(userId),
  ]);

  return (
    <main className="mx-auto max-w-2xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Tagihan Saya</h1>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Periode</th>
            <th>Komponen</th>
            <th>Nominal</th>
            <th>Terbayar</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tagihan.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="py-2">{t.periode.kode}</td>
              <td>{t.komponen}</td>
              <td>{formatRupiah(t.nominal)}</td>
              <td>{formatRupiah(t.terbayar)}</td>
              <td>{LABEL_STATUS[t.status] ?? t.status}</td>
            </tr>
          ))}
          {tagihan.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-muted">
                Belum ada tagihan.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-ink">Riwayat Bantuan Diterima</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Periode</th>
              <th>Nominal</th>
              <th>Dari</th>
              <th>Tanggal salur</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.periodeKode}</td>
                <td>{formatRupiah(r.nominal)}</td>
                <td>{r.namaDonaturTampilan}</td>
                <td>{r.tglSalur ? r.tglSalur.toLocaleDateString("id-ID") : "-"}</td>
              </tr>
            ))}
            {riwayat.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted">
                  Belum ada bantuan yang tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
