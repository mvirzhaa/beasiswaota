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
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Komitmen Donasi</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Buat komitmen baru</h2>
        <FormKomitmen periodeList={periodeList} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Komitmen saya</h2>
        <div className="mt-3 flex flex-col gap-3">
          {komitmenList.map((k) => (
            <div key={k.id} className="rounded border p-3 text-sm">
              <p className="font-medium">
                {k.skema} · {formatRupiah(k.nominalPerPeriode)} / periode · {k.jumlahPeriode}x
              </p>
              <p className="text-gray-600">
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
            <p className="text-sm text-gray-500">Belum ada komitmen.</p>
          )}
        </div>
      </section>
    </main>
  );
}
