import { prisma } from "@/lib/db";
import { FormImporMonitoring } from "./form-impor-monitoring";

export default async function HalamanImporMonitoring() {
  const periodeList = await prisma.periode.findMany({
    orderBy: { tglBuka: "desc" },
    select: { id: true, kode: true },
  });

  return (
    <main className="mx-auto max-w-4xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Impor Monitoring Akademik (XLSX)</h1>
      <p className="mt-1 text-sm text-muted">
        Kolom: NIM, IP Semester, IPK, SKS Semester, SKS Kumulatif, Status Akademik, Persen
        Kehadiran. Baris pertama adalah header.
      </p>

      <FormImporMonitoring periodeList={periodeList} />
    </main>
  );
}
