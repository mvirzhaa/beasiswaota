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
    <main className="mx-auto max-w-4xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Pembinaan (Relasi Asuh)</h1>
      <p className="mt-1 text-sm text-muted">
        Relasi ini murni untuk monitoring — TIDAK menentukan dana donatur mana yang membiayai
        mahasiswa mana.
      </p>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-bold text-ink">Tugaskan relasi baru</h2>
        <FormTugaskan ortuAsuhList={ortuAsuhList} mahasiswaList={mahasiswaList} periodeList={periodeList} />
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-ink">Daftar relasi</h2>
        <div className="mt-3 flex flex-col gap-3">
          {relasiList.map((r) => (
            <BarisRelasi key={r.id} relasi={r} ortuAsuhList={ortuAsuhList} periodeList={periodeList} />
          ))}
          {relasiList.length === 0 && (
            <p className="text-sm text-muted">Belum ada relasi.</p>
          )}
        </div>
      </section>
    </main>
  );
}
