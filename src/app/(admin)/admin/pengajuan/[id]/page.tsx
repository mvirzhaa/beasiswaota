import { notFound } from "next/navigation";
import { ambilPengajuanDetailAdmin } from "@/server/queries/pengajuan";
import { PanelVerifikasi } from "./panel-verifikasi";

export default async function HalamanReviewPengajuan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pengajuan = await ambilPengajuanDetailAdmin(id);

  if (!pengajuan) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">
        Review Pengajuan — {pengajuan.mahasiswa.nama}
      </h1>
      <p className="text-sm text-gray-600">
        {pengajuan.mahasiswa.nim} · {pengajuan.mahasiswa.fakultas} /{" "}
        {pengajuan.mahasiswa.prodi} · Periode {pengajuan.periode.kode}
      </p>

      <PanelVerifikasi pengajuan={pengajuan} />
    </main>
  );
}
