import { notFound } from "next/navigation";
import Image from "next/image";
import { HeartHandshake, Wallet, ClipboardList, Users, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/uang";
import { Lencana } from "@/components/ui/lencana";
import { FooterProgram } from "@/components/ui/footer-program";
import { ambilKomitmenOrtuAsuh, ambilJadwalBayarOrtuAsuh } from "@/server/queries/komitmen";
import { ambilLaporanPenyaluranOrtuAsuh } from "@/server/queries/laporan";
import { ambilDaftarBinaanOrtuAsuh } from "@/server/queries/relasi";
import { labelSkema } from "@/lib/pendaftaran-donatur/label";
import { TombolBayarVA } from "./tombol-bayar-va";

export const dynamic = "force-dynamic";

const LABEL_STATUS_JADWAL: Record<string, string> = {
  BELUM_JATUH_TEMPO: "Belum Jatuh Tempo",
  JATUH_TEMPO: "Jatuh Tempo",
  TERBAYAR: "Terbayar",
  TERLAMBAT: "Terlambat",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS_JADWAL: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  BELUM_JATUH_TEMPO: "netral",
  JATUH_TEMPO: "peringatan",
  TERBAYAR: "sukses",
  TERLAMBAT: "bahaya",
  DIBATALKAN: "netral",
};

const LABEL_STATUS_KOMITMEN: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi Admin",
  AKTIF: "Aktif",
  MENUNGGAK: "Menunggak",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS_KOMITMEN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_KONFIRMASI: "peringatan",
  AKTIF: "sukses",
  MENUNGGAK: "bahaya",
  SELESAI: "sukses",
  DIBATALKAN: "netral",
};

export default async function HalamanLaporanDonatur({
  params,
}: {
  params: Promise<{ kodeAkses: string }>;
}) {
  const { kodeAkses } = await params;

  const ortuAsuh = await prisma.ortuAsuh.findUnique({ where: { kodeAkses } });
  if (!ortuAsuh) {
    notFound();
  }

  const [komitmenList, jadwalList, laporanPenyaluran, binaanList] = await Promise.all([
    ambilKomitmenOrtuAsuh(ortuAsuh.id),
    ambilJadwalBayarOrtuAsuh(ortuAsuh.id),
    ambilLaporanPenyaluranOrtuAsuh(ortuAsuh.id),
    ambilDaftarBinaanOrtuAsuh(ortuAsuh.id),
  ]);

  const namaDonatur = ortuAsuh.anonim
    ? "Hamba Allah"
    : ortuAsuh.atasNamaMunfiq || ortuAsuh.nama;
  const jadwalBelumLunas = jadwalList.filter(
    (j) => j.status !== "TERBAYAR" && j.status !== "DIBATALKAN",
  );
  const totalDisalurkan = laporanPenyaluran.reduce((acc, b) => acc + b.totalDisalurkan, 0n);

  return (
    <main className="flex min-h-screen flex-col bg-surface-alt">
      <section className="bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] text-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-8 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-uika.png"
              alt="Logo UIKA"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="text-xs font-medium text-white/80">
              Beasiswa Orangtua Asuh — Universitas Ibn Khaldun Bogor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-accent" />
            <h1 className="font-heading text-2xl font-bold">Laporan Donatur — {namaDonatur}</h1>
          </div>
          <p className="text-sm text-white/85">
            Terima kasih atas kepedulian Anda. Halaman ini khusus untuk Anda — jangan bagikan
            tautannya ke orang lain.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {/* Ringkasan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Wallet className="h-4 w-4 text-primary" />
              <span>Total Dana Tersalurkan</span>
            </div>
            <p className="mt-2 font-heading text-2xl font-bold text-primary">
              {formatRupiah(totalDisalurkan)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Users className="h-4 w-4 text-primary" />
              <span>Mahasiswa Binaan</span>
            </div>
            <p className="mt-2 font-heading text-2xl font-bold text-primary">{binaanList.length}</p>
          </div>
        </div>

        {/* Komitmen */}
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <h2 className="font-heading text-lg font-bold text-ink">Komitmen Donasi</h2>
          <div className="mt-4 flex flex-col gap-3">
            {komitmenList.map((k) => (
              <div key={k.id} className="rounded-xl border border-border bg-surface-alt/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Skema {labelSkema(k.skema)}
                    </span>
                    <p className="font-heading text-lg font-bold text-primary">
                      {formatRupiah(k.nominalPerPeriode)}
                      <span className="text-xs font-normal text-muted"> / periode</span>
                    </p>
                  </div>
                  <Lencana nada={NADA_STATUS_KOMITMEN[k.status] ?? "netral"}>
                    {LABEL_STATUS_KOMITMEN[k.status] ?? k.status}
                  </Lencana>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {k.tipe === "SEKALI" ? "Satu kali" : `Berkelanjutan (${k.jumlahPeriode} periode)`} ·{" "}
                  {k.mekanisme.replace(/_/g, " ")}
                </p>
              </div>
            ))}
            {komitmenList.length === 0 && (
              <p className="py-6 text-center text-xs text-muted">Belum ada komitmen donasi.</p>
            )}
          </div>
        </section>

        {/* Jadwal Pembayaran */}
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-lg font-bold text-ink">Jadwal Pembayaran</h2>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {jadwalBelumLunas.map((j) => (
              <div
                key={j.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-alt/40 p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-ink">{formatRupiah(j.nominal)}</p>
                  <p className="text-xs text-muted">
                    Periode {j.periode.kode} · Jatuh tempo{" "}
                    {j.jatuhTempo.toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Lencana nada={NADA_STATUS_JADWAL[j.status] ?? "netral"}>
                    {LABEL_STATUS_JADWAL[j.status] ?? j.status}
                  </Lencana>
                  <TombolBayarVA kodeAkses={kodeAkses} jadwalBayarId={j.id} />
                </div>
              </div>
            ))}
            {jadwalBelumLunas.length === 0 && (
              <p className="py-6 text-center text-xs text-muted">
                Tidak ada jadwal pembayaran yang belum lunas.
              </p>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Sudah transfer manual? Kirim bukti transfer lewat WhatsApp ke admin pengelola program
            untuk diverifikasi.
          </p>
        </section>

        {/* Laporan Penyaluran */}
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-lg font-bold text-ink">Laporan Penyaluran Dana</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Dana Anda dikelola secara pool (tidak diikat ke satu mahasiswa kecuali Anda memilih
            demikian saat mendaftar) dan disalurkan mesin alokasi ke mahasiswa yang paling
            membutuhkan. Identitas mahasiswa disamarkan demi privasi.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Penerima</th>
                  <th className="py-2 pr-4">Prodi</th>
                  <th className="py-2 pr-4">Jumlah Alokasi</th>
                  <th className="py-2">Total Disalurkan</th>
                </tr>
              </thead>
              <tbody>
                {laporanPenyaluran.map((b) => (
                  <tr key={b.mahasiswaId} className="border-b border-border/60">
                    <td className="py-2 pr-4 font-medium text-ink">{b.namaTampilan}</td>
                    <td className="py-2 pr-4 text-muted">{b.prodi}</td>
                    <td className="py-2 pr-4 text-muted">{b.jumlahAlokasi}</td>
                    <td className="py-2 font-semibold text-primary">
                      {formatRupiah(b.totalDisalurkan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {laporanPenyaluran.length === 0 && (
              <p className="py-6 text-center text-xs text-muted">
                Belum ada dana yang disalurkan dari donasi Anda.
              </p>
            )}
          </div>
        </section>

        {/* Mahasiswa Binaan */}
        {binaanList.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-lg font-bold text-ink">Mahasiswa Binaan</h2>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {binaanList.map((b) => (
                <div key={b.relasiId} className="rounded-xl border border-border bg-surface-alt/40 p-4">
                  <p className="font-semibold text-ink">
                    {b.nama} <span className="font-normal text-muted">({b.nim})</span>
                  </p>
                  <p className="text-xs text-muted">{b.prodi}</p>
                  {b.laporanTerbaru && (
                    <p className="mt-2 text-xs text-ink">
                      <span className="font-semibold">Laporan terbaru ({b.laporanTerbaru.periodeKode}):</span>{" "}
                      {b.laporanTerbaru.isi}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <FooterProgram />
    </main>
  );
}
