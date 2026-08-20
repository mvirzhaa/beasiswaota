import { notFound } from "next/navigation";
import { formatRupiah } from "@/lib/uang";
import { ambilTransaksiDetailAdmin } from "@/server/queries/transaksi";
import { ambilPeriodeUntukKomitmen } from "@/server/queries/komitmen";
import { PanelVerifikasiTransaksi } from "./panel-verifikasi-transaksi";

export default async function HalamanReviewTransaksi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaksi = await ambilTransaksiDetailAdmin(id);

  if (!transaksi) {
    notFound();
  }

  const periodeList = transaksi.jadwalBayar ? [] : await ambilPeriodeUntukKomitmen();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">
        Review Transaksi — {transaksi.ortuAsuh.atasNamaMunfiq || transaksi.ortuAsuh.nama}
      </h1>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-gray-500">Status</dt>
        <dd>{transaksi.status}</dd>
        <dt className="text-gray-500">Nominal</dt>
        <dd>{formatRupiah(transaksi.nominal)}</dd>
        <dt className="text-gray-500">Metode</dt>
        <dd>{transaksi.metode}</dd>
        <dt className="text-gray-500">Tanggal bayar</dt>
        <dd>{transaksi.tglBayar.toLocaleDateString("id-ID")}</dd>
        <dt className="text-gray-500">Untuk jadwal</dt>
        <dd>
          {transaksi.jadwalBayar
            ? `${transaksi.jadwalBayar.periode.kode} #${transaksi.jadwalBayar.urutan}`
            : "Donasi bebas (pilih periode di bawah)"}
        </dd>
      </dl>

      {transaksi.buktiObjectKey && (
        <a
          href={`/api/bukti-transaksi/${transaksi.id}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block underline"
        >
          Lihat bukti transfer
        </a>
      )}

      {transaksi.status === "MENUNGGU_VERIFIKASI" && (
        <PanelVerifikasiTransaksi
          transaksiId={transaksi.id}
          butuhPeriode={!transaksi.jadwalBayar}
          periodeList={periodeList}
        />
      )}
    </main>
  );
}
