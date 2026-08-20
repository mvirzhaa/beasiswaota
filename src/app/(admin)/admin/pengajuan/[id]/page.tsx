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
    <main className="mx-auto max-w-3xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">
        Review Pengajuan — {pengajuan.mahasiswa.nama}
      </h1>
      <p className="text-sm text-muted">
        {pengajuan.mahasiswa.nim} · {pengajuan.mahasiswa.fakultas} /{" "}
        {pengajuan.mahasiswa.prodi} · Periode {pengajuan.periode.kode}
      </p>

      <PanelVerifikasi pengajuan={pengajuan} />
    </main>
  );
}
