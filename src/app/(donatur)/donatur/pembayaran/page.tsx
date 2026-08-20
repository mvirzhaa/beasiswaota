import Image from "next/image";
import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import { ambilJadwalBayarOrtuAsuh } from "@/server/queries/komitmen";
import {
  ambilJadwalBayarTerbukaOrtuAsuh,
  ambilRiwayatTransaksiOrtuAsuh,
} from "@/server/queries/transaksi";
import { Lencana } from "@/components/ui/lencana";
import {
  Wallet,
  Calendar,
  Landmark,
  FileCheck2,
  Clock,
  ExternalLink,
  History,
  AlertTriangle,
} from "lucide-react";
import { FormUnggahBukti } from "./form-unggah-bukti";
import { TombolBayarVA } from "./tombol-bayar-va";

const LABEL_STATUS_JADWAL: Record<string, string> = {
  BELUM_JATUH_TEMPO: "Belum Jatuh Tempo",
  JATUH_TEMPO: "Jatuh Tempo",
  TERBAYAR: "Terbayar",
  TERLAMBAT: "Terlambat",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS_JADWAL: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  BELUM_JATUH_TEMPO: "netral",
  JATUH_TEMPO: "info",
  TERBAYAR: "sukses",
  TERLAMBAT: "bahaya",
  DIBATALKAN: "netral",
};

const LABEL_STATUS_TRANSAKSI: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  TERVERIFIKASI: "Terverifikasi",
  DITOLAK: "Ditolak",
  DIKEMBALIKAN: "Dikembalikan",
};

const NADA_STATUS_TRANSAKSI: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_VERIFIKASI: "peringatan",
  TERVERIFIKASI: "sukses",
  DITOLAK: "bahaya",
  DIKEMBALIKAN: "netral",
};

function sisaHari(jatuhTempo: Date): { teks: string; lewat: boolean } {
  const hariIni = new Date();
  const selisihMs = jatuhTempo.getTime() - hariIni.getTime();
  const hari = Math.ceil(selisihMs / (1000 * 60 * 60 * 24));
  if (hari > 0) return { teks: `H-${hari}`, lewat: false };
  if (hari === 0) return { teks: "Hari Ini", lewat: false };
  return { teks: `Lewat ${Math.abs(hari)} hari`, lewat: true };
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
    <main className="mx-auto mt-6 mb-12 max-w-5xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <Wallet className="h-4 w-4 text-primary" />
          <span>Keuangan & Donasi</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Jadwal & Riwayat Pembayaran
        </h1>
        <p className="text-sm text-muted">
          Pantau jadwal jatuh tempo komitmen, lakukan pembayaran online atau transfer manual, dan unggah bukti transaksi.
        </p>
      </div>

      {/* Bagian 1: Jadwal Pembayaran */}
      <section className="mt-8">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Calendar className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">Jadwal Pembayaran</h2>
                <p className="text-xs text-muted">Daftar angsuran / komitmen donasi per semester</p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted">
              {jadwal.length} Jadwal
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pl-2">Periode</th>
                  <th className="pb-3">Cicilan / Urutan</th>
                  <th className="pb-3">Nominal</th>
                  <th className="pb-3">Jatuh Tempo</th>
                  <th className="pb-3">Sisa Waktu</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {jadwal.map((j) => {
                  const bisaBayar = j.status !== "TERBAYAR" && j.status !== "DIBATALKAN";
                  const sisa = bisaBayar ? sisaHari(j.jatuhTempo) : null;
                  return (
                    <tr
                      key={j.id}
                      className="transition-colors hover:bg-surface-alt/40"
                    >
                      <td className="py-3.5 pl-2 font-semibold text-ink">
                        Semester {j.periode.kode}
                      </td>
                      <td className="py-3.5 text-muted">
                        Ke-{j.urutan}
                      </td>
                      <td className="py-3.5 font-heading font-bold text-primary">
                        {formatRupiah(j.nominal)}
                      </td>
                      <td className="py-3.5 text-ink">
                        {j.jatuhTempo.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5">
                        {sisa ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              sisa.lewat ? "text-red-600 font-semibold" : "text-ink/80"
                            }`}
                          >
                            {sisa.lewat && <AlertTriangle className="h-3 w-3" />}
                            {sisa.teks}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <Lencana nada={NADA_STATUS_JADWAL[j.status] ?? "netral"}>
                          {LABEL_STATUS_JADWAL[j.status] ?? j.status}
                        </Lencana>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        {bisaBayar && <TombolBayarVA jadwalBayarId={j.id} />}
                      </td>
                    </tr>
                  );
                })}
                {jadwal.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted">
                      <Clock className="mx-auto h-8 w-8 text-muted/40" />
                      <p className="mt-2 font-medium text-ink">Belum Ada Jadwal Pembayaran</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Jadwal akan muncul setelah komitmen donasi aktif disetujui.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bagian 2: Rekening & Form Unggah Bukti */}
      <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Rekening Resmi */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden h-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-dark via-primary to-[#0e584f] p-6 text-white shadow-xs">
            <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-10">
              <Image
                src="/images/logo-uika.png"
                alt="Lambang UIKA"
                width={180}
                height={180}
                className="object-contain"
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-accent">
                    <Landmark className="h-4 w-4" />
                  </span>
                  <h2 className="font-heading text-lg font-bold text-white">Rekening Resmi Program</h2>
                </div>
                <Image
                  src="/images/logo-uika.png"
                  alt="Logo UIKA"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain drop-shadow-xs"
                />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-white/80">
                Silakan lakukan transfer manual ke rekening resmi beasiswa UIKA di bawah ini:
              </p>

              <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xs">
                <p className="text-xs text-white/70">Bank Syariah Indonesia (BSI) / BSI UIKA</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-wider text-accent">
                  7367215121
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  a.n. Orang Tua Asuh UIKA Bogor
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-white/75">
              <p className="flex items-start gap-1.5">
                <span className="font-bold text-accent">1.</span>
                <span>Pastikan nominal yang ditransfer sesuai dengan komitmen atau kebutuhan bantuan.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="font-bold text-accent">2.</span>
                <span>Simpan struk / bukti transfer m-Banking / ATM dalam format PDF atau foto (JPG/PNG).</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="font-bold text-accent">3.</span>
                <span>Unggah bukti pada form di samping agar tim admin segera memverifikasi dana Anda.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Unggah Bukti */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-border pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent-dark">
                <FileCheck2 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">Unggah Bukti Transfer</h2>
                <p className="text-xs text-muted">Kirimkan bukti transaksi untuk verifikasi admin</p>
              </div>
            </div>
            <FormUnggahBukti jadwalTerbuka={jadwalTerbuka} />
          </div>
        </div>
      </section>

      {/* Bagian 3: Riwayat Transaksi */}
      <section className="mt-8">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                <History className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">Riwayat Transaksi</h2>
                <p className="text-xs text-muted">Daftar pembayaran yang telah diunggah dan diverifikasi</p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted">
              {riwayat.length} Transaksi
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-3 pl-2">Tanggal Bayar</th>
                  <th className="pb-3">Nominal</th>
                  <th className="pb-3">Metode</th>
                  <th className="pb-3">Peruntukan</th>
                  <th className="pb-3">Status Verifikasi</th>
                  <th className="pb-3 pr-2 text-right">Bukti Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {riwayat.map((t) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-surface-alt/40"
                  >
                    <td className="py-3.5 pl-2 text-ink">
                      {t.tglBayar.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 font-heading font-bold text-primary">
                      {formatRupiah(t.nominal)}
                    </td>
                    <td className="py-3.5 text-xs text-muted font-medium">
                      {t.metode.replace("_", " ")}
                    </td>
                    <td className="py-3.5 text-ink">
                      {t.jadwalBayar ? (
                        <span className="font-medium">
                          Semester {t.jadwalBayar.periode.kode} #{t.jadwalBayar.urutan}
                        </span>
                      ) : (
                        <span className="text-muted">Donasi Bebas</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <Lencana nada={NADA_STATUS_TRANSAKSI[t.status] ?? "netral"}>
                        {LABEL_STATUS_TRANSAKSI[t.status] ?? t.status}
                      </Lencana>
                      {t.status === "DITOLAK" && t.catatanTolak && (
                        <span className="mt-1 block text-xs text-red-600 font-medium">
                          Catatan: {t.catatanTolak}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {t.buktiObjectKey ? (
                        <a
                          href={`/api/bukti-transaksi/${t.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline hover:text-primary-dark"
                        >
                          <span>Lihat Berkas</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {riwayat.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      <History className="mx-auto h-8 w-8 text-muted/40" />
                      <p className="mt-2 font-medium text-ink">Belum Ada Riwayat Transaksi</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Riwayat pembayaran Anda akan tercatat di sini setelah bukti diunggah atau pembayaran VA selesai.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
