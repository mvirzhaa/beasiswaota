import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import { ambilJadwalBayarOrtuAsuh } from "@/server/queries/komitmen";

const LABEL_STATUS: Record<string, string> = {
  BELUM_JATUH_TEMPO: "Belum jatuh tempo",
  JATUH_TEMPO: "Jatuh tempo",
  TERBAYAR: "Terbayar",
  TERLAMBAT: "Terlambat",
  DIBATALKAN: "Dibatalkan",
};

function sisaHari(jatuhTempo: Date): string {
  const hariIni = new Date();
  const selisihMs = jatuhTempo.getTime() - hariIni.getTime();
  const hari = Math.ceil(selisihMs / (1000 * 60 * 60 * 24));
  if (hari > 0) return `H-${hari}`;
  if (hari === 0) return "Hari ini";
  return `Lewat ${Math.abs(hari)} hari`;
}

export default async function HalamanPembayaranDonatur() {
  const session = await auth();
  const userId = session!.user.id;

  const jadwal = await ambilJadwalBayarOrtuAsuh(userId);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Jadwal Pembayaran</h1>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Periode</th>
            <th>Urutan</th>
            <th>Nominal</th>
            <th>Jatuh tempo</th>
            <th>Sisa hari</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {jadwal.map((j) => (
            <tr key={j.id} className="border-b">
              <td className="py-2">{j.periode.kode}</td>
              <td>{j.urutan}</td>
              <td>{formatRupiah(j.nominal)}</td>
              <td>{j.jatuhTempo.toLocaleDateString("id-ID")}</td>
              <td>{j.status === "TERBAYAR" || j.status === "DIBATALKAN" ? "-" : sisaHari(j.jatuhTempo)}</td>
              <td>{LABEL_STATUS[j.status] ?? j.status}</td>
            </tr>
          ))}
          {jadwal.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                Belum ada jadwal pembayaran.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
