import { ambilAntrianModerasiPesan } from "@/server/queries/pesan-binaan";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import { BarisModerasiPesan } from "./baris-moderasi-pesan";

export default async function HalamanModerasiPesan() {
  const antrian = await ambilAntrianModerasiPesan();

  return (
    <main className="mx-auto mt-6 mb-12 max-w-5xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span>Moderasi Komunikasi</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Antrean Moderasi Pesan Binaan
        </h1>
        <p className="text-sm text-muted">
          Periksa konten pesan silaturahmi sebelum diteruskan ke donatur atau mahasiswa. Cegah kebocoran kontak pribadi.
        </p>
      </div>

      {/* Antrean Pesan */}
      <div className="mt-8 flex flex-col gap-4">
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
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface py-16 text-center shadow-xs">
            <CheckCircle2 className="h-12 w-12 text-green-600/60" />
            <h2 className="mt-3 font-heading text-lg font-bold text-ink">Semua Pesan Telah Dimoderasi</h2>
            <p className="mt-1 max-w-md text-xs text-muted">
              Tidak ada antrean pesan baru yang menunggu persetujuan verifikator saat ini.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
