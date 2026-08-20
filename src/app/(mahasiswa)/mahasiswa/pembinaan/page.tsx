import { auth } from "@/lib/auth";
import { ambilRelasiMahasiswa } from "@/server/queries/relasi";
import { Users, ShieldCheck, HeartHandshake } from "lucide-react";
import { Lencana } from "@/components/ui/lencana";
import { TombolPersetujuan } from "./tombol-persetujuan";

export default async function HalamanPembinaanMahasiswa() {
  const session = await auth();
  const userId = session!.user.id;

  const relasiList = await ambilRelasiMahasiswa(userId);

  return (
    <main className="mx-auto mt-6 mb-12 max-w-4xl px-4 sm:px-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-dark uppercase">
          <Users className="h-4 w-4 text-primary" />
          <span>Mentoring & Pendampingan</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Relasi Pembinaan Mahasiswa
        </h1>
        <p className="text-sm text-muted">
          Kelola persetujuan akses pemantauan progres akademik oleh Orang Tua Asuh pendamping Anda.
        </p>
      </div>

      {/* Info Perlindungan & Hak Mahasiswa */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-light/40 p-4 text-xs text-ink shadow-xs">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="leading-relaxed">
          <p className="font-bold text-primary-dark">Hak Privasi & Ketentuan Persetujuan:</p>
          <p className="mt-0.5 text-muted">
            Sesuai pedoman program, persetujuan pemantauan progres studi bersifat sukarela. Anda berhak menyetujui, menolak, atau menarik persetujuan kapan saja tanpa memengaruhi hak beasiswa Anda.
          </p>
        </div>
      </div>

      {/* Daftar Relasi */}
      <div className="mt-8 flex flex-col gap-4">
        {relasiList.map((r) => {
          const namaOrtu = r.ortuAsuh.anonim
            ? "Donatur Orang Tua Asuh (Anonim)"
            : r.ortuAsuh.atasNamaMunfiq || r.ortuAsuh.nama;

          return (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs transition-all hover:border-primary/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary font-bold text-base shadow-xs">
                    {namaOrtu.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-bold text-ink">{namaOrtu}</h2>
                    <p className="text-xs text-muted">
                      Terhubung sejak Periode <strong>{r.periodeMulai.kode}</strong>
                    </p>
                  </div>
                </div>
                <Lencana nada={r.persetujuanMahasiswa ? "sukses" : "peringatan"}>
                  {r.persetujuanMahasiswa ? "Pemantauan Disetujui" : "Belum Disetujui"}
                </Lencana>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted max-w-md">
                  {r.persetujuanMahasiswa
                    ? "Orang tua asuh dapat memantau ringkasan nilai IPK dan perkembangan studi yang Anda izinkan."
                    : "Orang tua asuh saat ini belum dapat melihat data progres akademik Anda."}
                </p>
                <TombolPersetujuan relasiId={r.id} disetujui={r.persetujuanMahasiswa} />
              </div>
            </div>
          );
        })}

        {relasiList.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface py-16 text-center shadow-xs">
            <HeartHandshake className="h-12 w-12 text-muted/40" />
            <h2 className="mt-3 font-heading text-lg font-bold text-ink">Belum Ada Relasi Pembinaan</h2>
            <p className="mt-1 max-w-md text-xs text-muted">
              Admin belum menugaskan Orang Tua Asuh untuk mendampingi akun Anda.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
