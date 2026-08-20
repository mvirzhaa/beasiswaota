import { HandCoins, Calendar, Layers, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import {
  ambilPeriodeUntukKomitmen,
  ambilKomitmenOrtuAsuh,
} from "@/server/queries/komitmen";
import { Lencana } from "@/components/ui/lencana";
import { FormKomitmen } from "./form-komitmen";
import { TombolBatalkanKomitmen } from "./tombol-batalkan";

const LABEL_STATUS: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi",
  AKTIF: "Aktif",
  MENUNGGAK: "Menunggak",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

const NADA_STATUS: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_KONFIRMASI: "peringatan",
  AKTIF: "sukses",
  MENUNGGAK: "bahaya",
  SELESAI: "sukses",
  DIBATALKAN: "netral",
};

export default async function HalamanKomitmenDonatur() {
  const session = await auth();
  const userId = session!.user.id;

  const [periodeList, komitmenList] = await Promise.all([
    ambilPeriodeUntukKomitmen(),
    ambilKomitmenOrtuAsuh(userId),
  ]);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-5xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <HandCoins className="h-4 w-4 text-primary" />
          <span>Komitmen Donatur</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">Komitmen Donasi</h1>
        <p className="text-sm text-muted">
          Pilih skema bantuan, jangka waktu semester, serta mekanisme pembayaran yang Anda kehendaki.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kolom Kiri: Form Komitmen Baru */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">Buat Komitmen Baru</h2>
                <p className="text-xs text-muted">Isi formulir komitmen donasi beasiswa</p>
              </div>
            </div>
            <FormKomitmen periodeList={periodeList} />
          </div>
        </div>

        {/* Kolom Kanan: Daftar Komitmen Saya */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent-dark">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-ink">Komitmen Saya</h2>
                  <p className="text-xs text-muted">Total: {komitmenList.length} komitmen</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3.5">
              {komitmenList.map((k) => (
                <div
                  key={k.id}
                  className="rounded-xl border border-border bg-surface-alt/40 p-4 transition-all duration-150 hover:border-primary/40 hover:bg-surface-alt/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                        Skema {k.skema}
                      </span>
                      <p className="font-heading text-lg font-bold text-primary">
                        {formatRupiah(k.nominalPerPeriode)}
                        <span className="text-xs font-normal text-muted"> / semester</span>
                      </p>
                    </div>
                    <Lencana nada={NADA_STATUS[k.status] ?? "netral"}>
                      {LABEL_STATUS[k.status] ?? k.status}
                    </Lencana>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-2.5 text-xs text-muted">
                    <div>
                      <span className="block text-ink/70">Durasi:</span>
                      <span className="font-medium text-ink">{k.jumlahPeriode} Semester</span>
                    </div>
                    <div>
                      <span className="block text-ink/70">Mekanisme:</span>
                      <span className="font-medium text-ink">{k.mekanisme.replace("_", " ")}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-ink/70">Ritme Pembayaran:</span>
                      <span className="font-medium text-ink">{k.ritme.replace("_", " ")}</span>
                    </div>
                  </div>

                  {(k.status === "MENUNGGU_KONFIRMASI" || k.status === "AKTIF") && (
                    <div className="mt-3 border-t border-border/70 pt-2.5">
                      <TombolBatalkanKomitmen komitmenId={k.id} />
                    </div>
                  )}
                </div>
              ))}

              {komitmenList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-muted">
                    <Calendar className="h-6 w-6 opacity-60" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">Belum Ada Komitmen</p>
                  <p className="mt-0.5 text-xs text-muted max-w-[220px]">
                    Silakan buat komitmen donasi baru melalui formulir di samping.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
