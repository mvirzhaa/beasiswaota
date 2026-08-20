import { ambilAntrianModerasiPesan } from "@/server/queries/pesan-binaan";
import { BarisModerasiPesan } from "./baris-moderasi-pesan";

export default async function HalamanModerasiPesan() {
  const antrian = await ambilAntrianModerasiPesan();

  return (
    <main className="mx-auto max-w-3xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Moderasi Pesan Binaan</h1>

      <div className="mt-4 flex flex-col gap-3">
        {antrian.map((p) => (
          <BarisModerasiPesan
            key={p.id}
            pesan={{
              id: p.id,
              isi: p.isi,
              namaOrtuAsuh: p.relasiAsuh.ortuAsuh.nama,
              namaMahasiswa: `${p.relasiAsuh.mahasiswa.nama} (${p.relasiAsuh.mahasiswa.nim})`,
              pengirimRole: p.pengirim.role,
            }}
          />
        ))}
        {antrian.length === 0 && (
          <p className="text-sm text-muted">Tidak ada pesan menunggu moderasi.</p>
        )}
      </div>
    </main>
  );
}
