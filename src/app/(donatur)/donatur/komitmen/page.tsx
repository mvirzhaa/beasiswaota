import { auth } from "@/lib/auth";
import { formatRupiah } from "@/lib/uang";
import {
  ambilPeriodeUntukKomitmen,
  ambilKomitmenOrtuAsuh,
} from "@/server/queries/komitmen";
import { FormKomitmen } from "./form-komitmen";
import { TombolBatalkanKomitmen } from "./tombol-batalkan";

const LABEL_STATUS: Record<string, string> = {
  MENUNGGU_KONFIRMASI: "Menunggu konfirmasi admin",
  AKTIF: "Aktif",
  MENUNGGAK: "Menunggak",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export default async function HalamanKomitmenDonatur() {
  const session = await auth();
  const userId = session!.user.id;

  const [periodeList, komitmenList] = await Promise.all([
    ambilPeriodeUntukKomitmen(),
    ambilKomitmenOrtuAsuh(userId),
  ]);

  return (
    <main className="mx-auto max-w-2xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Komitmen Donasi</h1>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-bold text-ink">Buat komitmen baru</h2>
        <FormKomitmen periodeList={periodeList} />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-ink">Komitmen saya</h2>
        <div className="mt-3 flex flex-col gap-3">
          {komitmenList.map((k) => (
            <div key={k.id} className="rounded border p-3 text-sm">
              <p className="font-medium">
                {k.skema} · {formatRupiah(k.nominalPerPeriode)} / periode · {k.jumlahPeriode}x
              </p>
              <p className="text-muted">
                Mekanisme {k.mekanisme} · Ritme {k.ritme} ·{" "}
                {LABEL_STATUS[k.status] ?? k.status}
              </p>
              {(k.status === "MENUNGGU_KONFIRMASI" || k.status === "AKTIF") && (
                <div className="mt-2">
                  <TombolBatalkanKomitmen komitmenId={k.id} />
                </div>
              )}
            </div>
          ))}
          {komitmenList.length === 0 && (
            <p className="text-sm text-muted">Belum ada komitmen.</p>
          )}
        </div>
      </section>
    </main>
  );
}
