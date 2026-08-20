import { prisma } from "@/lib/db";
import { FormInputMonitoring } from "./form-input-monitoring";

export default async function HalamanInputMonitoring({
  searchParams,
}: {
  searchParams: Promise<{ mahasiswaId?: string; periodeId?: string }>;
}) {
  const params = await searchParams;

  const [mahasiswaList, periodeList, existing] = await Promise.all([
    prisma.mahasiswa.findMany({
      where: { statusAkademik: "AKTIF" },
      select: { id: true, nama: true, nim: true },
      orderBy: { nama: "asc" },
    }),
    prisma.periode.findMany({ orderBy: { tglBuka: "desc" }, select: { id: true, kode: true } }),
    params.mahasiswaId && params.periodeId
      ? prisma.monitoringAkademik.findUnique({
          where: {
            mahasiswaId_periodeId: { mahasiswaId: params.mahasiswaId, periodeId: params.periodeId },
          },
        })
      : null,
  ]);

  return (
    <main className="mx-auto max-w-xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Input Monitoring Akademik</h1>
      <FormInputMonitoring
        mahasiswaList={mahasiswaList}
        periodeList={periodeList}
        mahasiswaIdAwal={params.mahasiswaId}
        periodeIdAwal={params.periodeId}
        existing={existing}
      />
    </main>
  );
}
