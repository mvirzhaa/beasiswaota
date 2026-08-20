import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import { ambilJadwalBayarOrtuAsuh } from "@/server/queries/komitmen";
import {
  ambilJadwalBayarTerbukaOrtuAsuh,
  ambilRiwayatTransaksiOrtuAsuh,
} from "@/server/queries/transaksi";
import { FormUnggahBukti } from "./form-unggah-bukti";
import { TombolBayarVA } from "./tombol-bayar-va";

const LABEL_STATUS_JADWAL: Record<string, string> = {
  BELUM_JATUH_TEMPO: "Belum jatuh tempo",
  JATUH_TEMPO: "Jatuh tempo",
  TERBAYAR: "Terbayar",
  TERLAMBAT: "Terlambat",
  DIBATALKAN: "Dibatalkan",
};

const LABEL_STATUS_TRANSAKSI: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
  TERVERIFIKASI: "Terverifikasi",
  DITOLAK: "Ditolak",
  DIKEMBALIKAN: "Dikembalikan",
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

  const [jadwal, jadwalTerbuka, riwayat] = await Promise.all([
    ambilJadwalBayarOrtuAsuh(userId),
    ambilJadwalBayarTerbukaOrtuAsuh(userId),
    ambilRiwayatTransaksiOrtuAsuh(userId),
  ]);

  return (
    <main className="mx-auto max-w-3xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Jadwal Pembayaran</h1>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Periode</th>
            <th>Urutan</th>
            <th>Nominal</th>
            <th>Jatuh tempo</th>
            <th>Sisa hari</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {jadwal.map((j) => {
            const bisaBayar = j.status !== "TERBAYAR" && j.status !== "DIBATALKAN";
            return (
              <tr key={j.id} className="border-b">
                <td className="py-2">{j.periode.kode}</td>
                <td>{j.urutan}</td>
                <td>{formatRupiah(j.nominal)}</td>
                <td>{j.jatuhTempo.toLocaleDateString("id-ID")}</td>
                <td>{bisaBayar ? sisaHari(j.jatuhTempo) : "-"}</td>
                <td>{LABEL_STATUS_JADWAL[j.status] ?? j.status}</td>
                <td>{bisaBayar && <TombolBayarVA jadwalBayarId={j.id} />}</td>
              </tr>
            );
          })}
          {jadwal.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-center text-muted">
                Belum ada jadwal pembayaran.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-ink">Unggah bukti transfer</h2>
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm">
          <p className="font-semibold text-ink">Rekening resmi Program Beasiswa Orangtua Asuh</p>
          <p className="mt-1 text-ink">
            No. Rekening <span className="font-semibold">7367215121</span> a.n.{" "}
            <span className="font-semibold">Orang Tua Asuh UIKA Bogor</span>
          </p>
          <p className="mt-1 text-muted">
            Transfer ke rekening ini, lalu unggah buktinya di bawah supaya bisa diverifikasi admin.
          </p>
        </div>
        <FormUnggahBukti jadwalTerbuka={jadwalTerbuka} />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-ink">Riwayat transaksi</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Tanggal bayar</th>
              <th>Nominal</th>
              <th>Metode</th>
              <th>Untuk jadwal</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">{t.tglBayar.toLocaleDateString("id-ID")}</td>
                <td>{formatRupiah(t.nominal)}</td>
                <td>{t.metode}</td>
                <td>
                  {t.jadwalBayar
                    ? `${t.jadwalBayar.periode.kode} #${t.jadwalBayar.urutan}`
                    : "Donasi bebas"}
                </td>
                <td>
                  {LABEL_STATUS_TRANSAKSI[t.status] ?? t.status}
                  {t.status === "DITOLAK" && t.catatanTolak && (
                    <span className="block text-xs text-red-600">{t.catatanTolak}</span>
                  )}
                </td>
                <td>
                  {t.buktiObjectKey && (
                    <a
                      href={`/api/bukti-transaksi/${t.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Lihat bukti
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {riwayat.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-muted">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
