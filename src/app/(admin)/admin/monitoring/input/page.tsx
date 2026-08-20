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
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">Input Monitoring Akademik</h1>
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
