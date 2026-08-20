import { prisma } from "@/lib/db";
import {
  ambilDaftarRelasiAdmin,
  ambilOrtuAsuhUntukPenugasan,
  ambilMahasiswaUntukPenugasan,
} from "@/server/queries/relasi";
import { FormTugaskan } from "./form-tugaskan";
import { BarisRelasi } from "./baris-relasi";

export default async function HalamanPembinaanAdmin() {
  const [relasiList, ortuAsuhList, mahasiswaList, periodeList] = await Promise.all([
    ambilDaftarRelasiAdmin(),
    ambilOrtuAsuhUntukPenugasan(),
    ambilMahasiswaUntukPenugasan(),
    prisma.periode.findMany({ orderBy: { tglBuka: "desc" }, select: { id: true, kode: true } }),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">Pembinaan (Relasi Asuh)</h1>
      <p className="mt-1 text-sm text-gray-600">
        Relasi ini murni untuk monitoring — TIDAK menentukan dana donatur mana yang membiayai
        mahasiswa mana.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Tugaskan relasi baru</h2>
        <FormTugaskan ortuAsuhList={ortuAsuhList} mahasiswaList={mahasiswaList} periodeList={periodeList} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Daftar relasi</h2>
        <div className="mt-3 flex flex-col gap-3">
          {relasiList.map((r) => (
            <BarisRelasi key={r.id} relasi={r} ortuAsuhList={ortuAsuhList} periodeList={periodeList} />
          ))}
          {relasiList.length === 0 && (
            <p className="text-sm text-gray-500">Belum ada relasi.</p>
          )}
        </div>
      </section>
    </main>
  );
}
