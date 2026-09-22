import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { formatRupiah } from "@/lib/uang";
import { ambilMahasiswaDetailAdmin, ambilPeriodeUntukAdminMahasiswa } from "@/server/queries/mahasiswa";
import { ambilLaporanMahasiswa } from "@/server/queries/laporan-perkembangan";
import { ambilTagihanMahasiswa, ambilRiwayatBantuanMahasiswa } from "@/server/queries/tagihan";
import {
  ambilMonitoringMahasiswaPeriode,
  ambilRiwayatMonitoringMahasiswa,
} from "@/server/queries/monitoring";
import { Lencana } from "@/components/ui/lencana";
import { FormUbahMahasiswa } from "./form-ubah-mahasiswa";
import { SelectorPeriode } from "./selector-periode";
import { FormLaporanAdmin } from "../form-laporan-admin";
import { TabDetailMahasiswa } from "./tab-detail-mahasiswa";
import { PanelTagihan } from "./panel-tagihan";
import { ModalMonitoring } from "./modal-monitoring";

const NADA_STATUS_AKADEMIK: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  AKTIF: "sukses",
  CUTI: "peringatan",
  LULUS: "info",
  DO: "bahaya",
};

const NADA_RISIKO: Record<string, "sukses" | "peringatan" | "bahaya" | "info" | "netral"> = {
  AMAN: "sukses",
  PERHATIAN: "peringatan",
  KRITIS: "bahaya",
};

export default async function HalamanDetailMahasiswaAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periode?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const mahasiswa = await ambilMahasiswaDetailAdmin(id);
  if (!mahasiswa) {
    notFound();
  }

  const periodeList = await ambilPeriodeUntukAdminMahasiswa();
  const periodeAktif = sp.periode
    ? periodeList.find((p) => p.id === sp.periode)
    : periodeList[0];

  const [laporan, tagihanList, riwayatBantuan, monitoringPeriodeIni, riwayatMonitoring] = await Promise.all([
    periodeAktif ? ambilLaporanMahasiswa(mahasiswa.id, periodeAktif.id) : null,
    ambilTagihanMahasiswa(mahasiswa.id),
    ambilRiwayatBantuanMahasiswa(mahasiswa.id),
    periodeAktif ? ambilMonitoringMahasiswaPeriode(mahasiswa.id, periodeAktif.id) : null,
    ambilRiwayatMonitoringMahasiswa(mahasiswa.id),
  ]);

  const totalTagihan = tagihanList.reduce((acc, t) => acc + t.nominal, 0n);
  const totalTerbayar = tagihanList.reduce((acc, t) => acc + t.terbayar, 0n);
  const totalBantuan = riwayatBantuan.reduce((acc, r) => acc + r.nominal, 0n);

  const laporanContent = (
    <div className="space-y-4">
      {/* Selector Periode */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs">
        <SelectorPeriode periodeList={periodeList} periodeAktifId={periodeAktif?.id} />
      </div>

      {periodeAktif ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-ink">
                Laporan Studi — Periode {periodeAktif.kode}
              </h3>
              <p className="text-xs text-muted">
                Pemeriksaan capaian IPK, SKS, dan unggah scan Kartu Hasil Studi (KHS).
              </p>
            </div>
            {laporan && (
              <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-ink">
                Status: {laporan.status}
              </span>
            )}
          </div>
          <FormLaporanAdmin mahasiswaId={mahasiswa.id} periodeId={periodeAktif.id} laporan={laporan} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-xs text-muted shadow-2xs">
          Belum ada periode yang dapat dipilih.
        </div>
      )}
    </div>
  );

  const tagihanContent = (
    <PanelTagihan
      mahasiswaId={mahasiswa.id}
      periodeList={periodeList.map((p) => ({ id: p.id, kode: p.kode }))}
      tagihanList={tagihanList.map((t) => ({
        id: t.id,
        komponen: t.komponen,
        periodeId: t.periodeId,
        periodeKode: t.periode.kode,
        nominal: t.nominal.toString(),
        terbayar: t.terbayar.toString(),
        status: t.status,
        jatuhTempoIso: t.jatuhTempo.toISOString(),
      }))}
      totalTagihanTampilan={formatRupiah(totalTagihan)}
      totalTerbayarTampilan={formatRupiah(totalTerbayar)}
    />
  );

  const monitoringContent = (
    <div className="space-y-4">
      {/* Selector Periode */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs">
        <SelectorPeriode periodeList={periodeList} periodeAktifId={periodeAktif?.id} />
      </div>

      {periodeAktif ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-ink">
                Hasil Studi — Periode {periodeAktif.kode}
              </h3>
              <p className="text-xs text-muted">
                IPK, IP semester, SKS, status akademik — dipakai kartu risiko & ditampilkan ke donatur pembina.
              </p>
            </div>
            <ModalMonitoring
              mahasiswaId={mahasiswa.id}
              periodeId={periodeAktif.id}
              periodeKode={periodeAktif.kode}
              data={monitoringPeriodeIni}
            />
          </div>

          {monitoringPeriodeIni ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-surface-alt/60 p-3">
                <span className="text-[11px] text-muted">IPK</span>
                <p className="font-mono text-lg font-bold text-ink">{monitoringPeriodeIni.ipk?.toFixed(2) ?? "-"}</p>
              </div>
              <div className="rounded-xl bg-surface-alt/60 p-3">
                <span className="text-[11px] text-muted">IP Semester</span>
                <p className="font-mono text-lg font-bold text-ink">{monitoringPeriodeIni.ipSemester?.toFixed(2) ?? "-"}</p>
              </div>
              <div className="rounded-xl bg-surface-alt/60 p-3">
                <span className="text-[11px] text-muted">SKS Smt/Kumulatif</span>
                <p className="font-mono text-lg font-bold text-ink">
                  {monitoringPeriodeIni.sksSemester ?? "-"}/{monitoringPeriodeIni.sksKumulatif ?? "-"}
                </p>
              </div>
              <div className="rounded-xl bg-surface-alt/60 p-3">
                <span className="text-[11px] text-muted">Risiko</span>
                <p className="mt-1">
                  <Lencana nada={NADA_RISIKO[monitoringPeriodeIni.risiko] ?? "netral"}>
                    {monitoringPeriodeIni.risiko}
                  </Lencana>
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-surface-alt/60 p-4 text-center text-xs text-muted">
              Belum ada data monitoring untuk periode ini.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-xs text-muted shadow-2xs">
          Belum ada periode yang dapat dipilih.
        </div>
      )}

      {riwayatMonitoring.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <h3 className="font-heading text-sm font-bold text-ink border-b border-border pb-3">Riwayat Lintas Periode</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 font-semibold uppercase tracking-wider text-muted">
                  <th className="pb-2">Periode</th>
                  <th className="pb-2 text-center">IPK</th>
                  <th className="pb-2 text-center">IP Semester</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {riwayatMonitoring.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 font-semibold text-ink">{m.periodeKode}</td>
                    <td className="py-2 text-center font-mono">{m.ipk?.toFixed(2) ?? "-"}</td>
                    <td className="py-2 text-center font-mono">{m.ipSemester?.toFixed(2) ?? "-"}</td>
                    <td className="py-2 text-center">{m.statusAkademik}</td>
                    <td className="py-2 text-right">
                      <Lencana nada={NADA_RISIKO[m.risiko] ?? "netral"}>{m.risiko}</Lencana>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const bantuanContent = (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="font-heading text-base font-bold text-ink">Riwayat Bantuan Disalurkan</h3>
          <p className="text-xs text-muted">Catatan pemotongan UKT yang berhasil dialokasikan dari donatur.</p>
        </div>
        <span className="rounded-lg bg-primary-light px-2.5 py-1 text-xs font-bold text-primary-dark">
          Akumulasi: {formatRupiah(totalBantuan)}
        </span>
      </div>

      <div className="divide-y divide-border/60">
        {riwayatBantuan.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-bold text-primary text-xs sm:text-sm">{formatRupiah(r.nominal)}</p>
              <p className="mt-0.5 text-xs text-muted">
                Periode {r.periodeKode} · Dari: <strong>{r.namaDonaturTampilan}</strong>
              </p>
            </div>
            {r.tglSalur && (
              <span className="rounded-md bg-surface-alt px-2 py-1 text-[11px] text-muted">
                Disalurkan: {r.tglSalur.toLocaleDateString("id-ID")}
              </span>
            )}
          </div>
        ))}
        {riwayatBantuan.length === 0 && (
          <p className="py-8 text-center text-xs text-muted">Belum ada riwayat bantuan yang disalurkan.</p>
        )}
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-[1550px] w-full px-5 py-6 sm:px-8 sm:py-7">
      {/* Back Button & Header */}
      <div className="mb-6 flex flex-col gap-2 border-b border-border pb-4">
        <Link
          href="/admin/mahasiswa"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors self-start"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Mahasiswa</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">{mahasiswa.nama}</h1>
            <p className="mt-0.5 text-xs text-muted sm:text-sm font-mono">
              NIM: {mahasiswa.nim} · {mahasiswa.fakultas} · {mahasiswa.prodi}
            </p>
          </div>
          <Lencana nada={NADA_STATUS_AKADEMIK[mahasiswa.statusAkademik] ?? "netral"}>
            Status: {mahasiswa.statusAkademik}
          </Lencana>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (5 cols): Profil & Edit Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-ink">Profil & Data Mahasiswa</h2>
            </div>
            <div className="mt-4">
              <FormUbahMahasiswa mahasiswa={mahasiswa} />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Tabbed Sections */}
        <div className="lg:col-span-7">
          <TabDetailMahasiswa
            laporanNode={laporanContent}
            monitoringNode={monitoringContent}
            tagihanNode={tagihanContent}
            bantuanNode={bantuanContent}
            jumlahTagihan={tagihanList.length}
            jumlahBantuan={riwayatBantuan.length}
          />
        </div>
      </div>
    </main>
  );
}
