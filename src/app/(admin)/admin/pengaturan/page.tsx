import { ambilFlagNamaPenuh } from "@/server/queries/laporan";
import { FormFlagNamaPenuh } from "./form-flag-nama-penuh";

export default async function HalamanPengaturanAdmin() {
  const aktif = await ambilFlagNamaPenuh();

  return (
    <main className="mx-auto max-w-xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Pengaturan</h1>

      <section className="mt-6 rounded border p-4">
        <h2 className="font-medium">Nama penuh di laporan penyaluran donatur</h2>
        <p className="mt-1 text-sm text-muted">
          Default: nama mahasiswa disamarkan jadi inisial + prodi (mis. &quot;A.S. — Teknik
          Informatika&quot;) di halaman /donatur/laporan. Aktifkan untuk menampilkan nama penuh.
        </p>
        <FormFlagNamaPenuh aktifSaatIni={aktif} />
      </section>
    </main>
  );
}
