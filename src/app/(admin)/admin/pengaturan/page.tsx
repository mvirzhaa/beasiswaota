import { ambilFlagNamaPenuh } from "@/server/queries/laporan";
import { FormFlagNamaPenuh } from "./form-flag-nama-penuh";

export default async function HalamanPengaturanAdmin() {
  const aktif = await ambilFlagNamaPenuh();

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">Pengaturan</h1>

      <section className="mt-6 rounded border p-4">
        <h2 className="font-medium">Nama penuh di laporan penyaluran donatur</h2>
        <p className="mt-1 text-sm text-gray-600">
          Default: nama mahasiswa disamarkan jadi inisial + prodi (mis. &quot;A.S. — Teknik
          Informatika&quot;) di halaman /donatur/laporan. Aktifkan untuk menampilkan nama penuh.
        </p>
        <FormFlagNamaPenuh aktifSaatIni={aktif} />
      </section>
    </main>
  );
}
