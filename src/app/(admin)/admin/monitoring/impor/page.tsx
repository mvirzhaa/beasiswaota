import { prisma } from "@/lib/db";
import { FormImporMonitoring } from "./form-impor-monitoring";

export default async function HalamanImporMonitoring() {
  const periodeList = await prisma.periode.findMany({
    orderBy: { tglBuka: "desc" },
    select: { id: true, kode: true },
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">Impor Monitoring Akademik (XLSX)</h1>
      <p className="mt-1 text-sm text-gray-600">
        Kolom: NIM, IP Semester, IPK, SKS Semester, SKS Kumulatif, Status Akademik, Persen
        Kehadiran. Baris pertama adalah header.
      </p>

      <FormImporMonitoring periodeList={periodeList} />
    </main>
  );
}
