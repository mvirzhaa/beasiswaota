import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, LinkIcon } from "lucide-react";
import { formatRupiah } from "@/lib/uang";
import { env } from "@/lib/env";
import { ambilOrtuAsuhDetailAdmin, ambilNotifikasiOrtuAsuh } from "@/server/queries/ortu-asuh";
import { Lencana } from "@/components/ui/lencana";
import { TabDetailOrtuAsuh } from "./tab-detail-ortu-asuh";
import { PanelNotifikasiWa } from "./panel-notifikasi-wa";

const LABEL_TIPE: Record<string, string> = {
  INDIVIDU: "Individu",
  DOSEN: "Dosen",
  TENAGA_KEPENDIDIKAN: "Tenaga Kependidikan",
  ALUMNI: "Alumni",
  INSTANSI: "Instansi",
};

const NADA_STATUS_KOMITMEN: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_KONFIRMASI: "peringatan",
  AKTIF: "sukses",
  MENUNGGAK: "bahaya",
  SELESAI: "info",
  DIBATALKAN: "netral",
};

const NADA_STATUS_TRANSAKSI: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  MENUNGGU_VERIFIKASI: "peringatan",
  TERVERIFIKASI: "sukses",
  DITOLAK: "bahaya",
  DIKEMBALIKAN: "netral",
};

export default async function HalamanDetailOrtuAsuhAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ortuAsuh = await ambilOrtuAsuhDetailAdmin(id);
  if (!ortuAsuh) {
    notFound();
  }

  const namaTampil = ortuAsuh.atasNamaMunfiq || ortuAsuh.nama;
  const tautanLaporan = `${env.APP_URL}/laporan/${ortuAsuh.kodeAkses}`;
  const riwayatNotifikasi = await ambilNotifikasiOrtuAsuh(id);

  const komitmenContent = (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="font-heading text-base font-bold text-ink">Komitmen Donasi</h3>
          <p className="text-xs text-muted">Janji donasi rutin/sekali dari donatur ini.</p>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {ortuAsuh.komitmen.map((k) => (
          <div key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-bold text-ink text-xs sm:text-sm">
                {formatRupiah(k.nominalPerPeriode)} / periode · {k.jumlahPeriode} periode
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {k.mekanisme.replace(/_/g, " ")}
                {k.targetMahasiswa
                  ? ` · Earmark untuk ${k.targetMahasiswa.nama} (${k.targetMahasiswa.nim})`
                  : " · Pool umum"}
              </p>
            </div>
            <Lencana nada={NADA_STATUS_KOMITMEN[k.status] ?? "netral"}>{k.status}</Lencana>
          </div>
        ))}
        {ortuAsuh.komitmen.length === 0 && (
          <p className="py-8 text-center text-xs text-muted">Belum ada komitmen donasi.</p>
        )}
      </div>
    </div>
  );

  const transaksiContent = (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="font-heading text-base font-bold text-ink">Riwayat Transaksi</h3>
          <p className="text-xs text-muted">Mutasi dana masuk dari donatur ini.</p>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {ortuAsuh.transaksi.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-bold text-ink text-xs sm:text-sm">{formatRupiah(t.nominal)}</p>
              <p className="mt-0.5 text-xs text-muted">
                {t.metode.replace(/_/g, " ")} · {t.tglBayar.toLocaleDateString("id-ID")}
              </p>
            </div>
            <Lencana nada={NADA_STATUS_TRANSAKSI[t.status] ?? "netral"}>{t.status}</Lencana>
          </div>
        ))}
        {ortuAsuh.transaksi.length === 0 && (
          <p className="py-8 text-center text-xs text-muted">Belum ada transaksi tercatat.</p>
        )}
      </div>
    </div>
  );

  const binaanContent = (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="font-heading text-base font-bold text-ink">Mahasiswa Binaan (Relasi Asuh)</h3>
          <p className="text-xs text-muted">Ditugaskan admin untuk pemantauan, terpisah dari aliran dana.</p>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {ortuAsuh.relasiAsuh.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-bold text-ink text-xs sm:text-sm">{r.mahasiswa.nama}</p>
              <p className="mt-0.5 text-xs text-muted">{r.mahasiswa.nim} · {r.mahasiswa.prodi}</p>
            </div>
          </div>
        ))}
        {ortuAsuh.relasiAsuh.length === 0 && (
          <p className="py-8 text-center text-xs text-muted">
            Belum ada relasi pembinaan yang ditugaskan admin untuk donatur ini.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      {/* Back Button & Header */}
      <div className="mb-6 flex flex-col gap-2 border-b border-border pb-4">
        <Link
          href="/admin/orangtua-asuh"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Kelola Orang Tua Asuh</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">{namaTampil}</h1>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              {LABEL_TIPE[ortuAsuh.tipe] ?? ortuAsuh.tipe} · {ortuAsuh.noHp}
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (5 cols): Profil Donatur */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-ink">Profil Donatur</h2>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Baris label="Nama" value={ortuAsuh.nama} />
              {ortuAsuh.atasNamaMunfiq && <Baris label="Atas Nama Munfiq" value={ortuAsuh.atasNamaMunfiq} />}
              <Baris label="Tipe" value={LABEL_TIPE[ortuAsuh.tipe] ?? ortuAsuh.tipe} />
              {ortuAsuh.instansi && <Baris label="Instansi" value={ortuAsuh.instansi} />}
              <Baris label="No. HP" value={ortuAsuh.noHp} />
              {ortuAsuh.email && <Baris label="Email" value={ortuAsuh.email} />}
              {ortuAsuh.nip && <Baris label="NIP" value={ortuAsuh.nip} />}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary-light/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-dark">
              <LinkIcon className="h-4 w-4 shrink-0" />
              <span>Tautan Laporan Donatur</span>
            </div>
            <p className="mt-1 text-[11px] text-muted">Akses tanpa login — kirim lewat panel WA di bawah.</p>
            <p className="mt-2 break-all rounded-lg bg-surface px-2.5 py-1.5 font-mono text-[11px] font-semibold text-primary-dark">
              {tautanLaporan}
            </p>
          </div>

          <PanelNotifikasiWa ortuAsuhId={ortuAsuh.id} riwayat={riwayatNotifikasi} />
        </div>

        {/* Right Column (7 cols): Tabbed Sections */}
        <div className="lg:col-span-7">
          <TabDetailOrtuAsuh
            komitmenNode={komitmenContent}
            transaksiNode={transaksiContent}
            binaanNode={binaanContent}
            jumlahKomitmen={ortuAsuh.komitmen.length}
            jumlahTransaksi={ortuAsuh.transaksi.length}
            jumlahBinaan={ortuAsuh.relasiAsuh.length}
          />
        </div>
      </div>
    </main>
  );
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5 last:border-b-0 last:pb-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-right text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}
