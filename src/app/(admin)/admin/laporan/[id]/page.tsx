import { notFound } from "next/navigation";
import { ambilLaporanDetailAdmin } from "@/server/queries/laporan-perkembangan";
import { PanelReviewLaporan } from "./panel-review-laporan";

export default async function HalamanReviewLaporan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const laporan = await ambilLaporanDetailAdmin(id);

  if (!laporan) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">
        Laporan — {laporan.mahasiswa.nama} ({laporan.mahasiswa.nim})
      </h1>
      <p className="text-sm text-gray-600">
        Periode {laporan.periode.kode} · Status {laporan.status} · Batas kirim{" "}
        {laporan.batasKirim.toLocaleDateString("id-ID")}
      </p>

      <p className="mt-4 whitespace-pre-wrap rounded border p-3 text-sm">{laporan.isi}</p>

      {laporan.lampiranKey && (
        <a
          href={`/api/lampiran-laporan/${laporan.id}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block underline"
        >
          Lihat lampiran
        </a>
      )}

      {laporan.status === "DIKIRIM" && <PanelReviewLaporan laporanId={laporan.id} />}
    </main>
  );
}
