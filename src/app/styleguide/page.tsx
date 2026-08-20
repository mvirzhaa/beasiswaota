import { Tombol } from "@/components/ui/tombol";
import { Lencana } from "@/components/ui/lencana";

const WARNA = [
  { nama: "primary", token: "--color-uika-primary", kelas: "bg-primary", teks: "text-white" },
  { nama: "primary-dark", token: "--color-uika-primary-dark", kelas: "bg-primary-dark", teks: "text-white" },
  { nama: "primary-light", token: "--color-uika-primary-light", kelas: "bg-primary-light", teks: "text-ink" },
  { nama: "accent", token: "--color-uika-accent", kelas: "bg-accent", teks: "text-ink" },
  { nama: "accent-dark", token: "--color-uika-accent-dark", kelas: "bg-accent-dark", teks: "text-white" },
  { nama: "navy", token: "--color-uika-navy", kelas: "bg-navy", teks: "text-white" },
  { nama: "ink", token: "--color-uika-ink", kelas: "bg-ink", teks: "text-white" },
  { nama: "muted", token: "--color-uika-muted", kelas: "bg-muted", teks: "text-white" },
  { nama: "surface-alt", token: "--color-uika-surface-alt", kelas: "bg-surface-alt", teks: "text-ink" },
];

export default function HalamanStyleguide() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="border-b border-border pb-6">
        <p className="text-sm font-medium text-accent-dark">Referensi desain</p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-ink">Styleguide</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Token warna diambil langsung dari <code>:root</code> di frontend/css/style.css milik
          uika-bogor.ac.id, font dari Google Fonts yang sama (Roboto + Yantramanav). Halaman ini
          murni referensi — belum ada halaman lain yang memakainya sampai disetujui.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-ink">Warna</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {WARNA.map((w) => (
            <div key={w.nama} className="overflow-hidden rounded-lg border border-border">
              <div className={`flex h-16 items-end p-2 ${w.kelas} ${w.teks}`}>
                <span className="text-xs font-medium">{w.nama}</span>
              </div>
              <p className="px-2 py-1 text-xs text-muted">{w.token}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-ink">Tipografi</h2>
        <div className="mt-4 flex flex-col gap-3">
          <p className="font-heading text-3xl font-bold text-ink">Judul H1 — Yantramanav Bold</p>
          <p className="font-heading text-2xl font-bold text-ink">Judul H2 — Yantramanav Bold</p>
          <p className="font-heading text-xl font-semibold text-ink">Judul H3 — Yantramanav</p>
          <p className="text-base text-ink">
            Teks isi — Roboto Regular. Dipakai untuk paragraf dan label formulir di seluruh
            aplikasi.
          </p>
          <p className="text-sm text-muted">Teks sekunder/muted — Roboto, untuk keterangan tambahan.</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-ink">Tombol</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Tombol variant="primer">Simpan</Tombol>
          <Tombol variant="aksen">Ajukan</Tombol>
          <Tombol variant="garis">Batal</Tombol>
          <Tombol variant="bahaya">Tolak</Tombol>
          <Tombol variant="tautan">Lihat detail</Tombol>
          <Tombol variant="primer" disabled>
            Nonaktif
          </Tombol>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-ink">Lencana status</h2>
        <p className="mt-1 text-sm text-muted">
          Pemetaan status domain yang sudah ada ke lima nada lencana — dipakai nanti saat rollout
          menggantikan teks status polos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Lencana nada="sukses">DISETUJUI</Lencana>
          <Lencana nada="sukses">LUNAS</Lencana>
          <Lencana nada="sukses">AMAN</Lencana>
          <Lencana nada="peringatan">LUNAS_SEBAGIAN</Lencana>
          <Lencana nada="peringatan">PERHATIAN</Lencana>
          <Lencana nada="peringatan">MENUNGGAK</Lencana>
          <Lencana nada="bahaya">DITOLAK</Lencana>
          <Lencana nada="bahaya">KRITIS</Lencana>
          <Lencana nada="bahaya">TERLAMBAT</Lencana>
          <Lencana nada="info">DIAJUKAN</Lencana>
          <Lencana nada="info">MENUNGGU_VERIFIKASI</Lencana>
          <Lencana nada="netral">DRAFT</Lencana>
          <Lencana nada="netral">BELUM_LUNAS</Lencana>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-ink">Formulir</h2>
        <div className="mt-4 flex max-w-sm flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink">Nominal kebutuhan (Rp)</span>
            <input
              className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="5000000"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink">Status orang tua</span>
            <select className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Lengkap</option>
              <option>Yatim</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink">Alasan (contoh field wajib dengan error)</span>
            <textarea
              rows={2}
              className="rounded-lg border border-red-400 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <span className="text-xs text-red-600">Wajib diisi minimal 20 karakter.</span>
          </label>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-bold text-ink">Tabel</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 font-medium">Mahasiswa</th>
              <th className="font-medium">Status</th>
              <th className="font-medium">Skor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-2 text-ink">Ahmad Fauzi (1200001)</td>
              <td>
                <Lencana nada="sukses">DISETUJUI</Lencana>
              </td>
              <td className="text-ink">82.5</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 text-ink">Siti Nurhaliza (1200002)</td>
              <td>
                <Lencana nada="info">DIAJUKAN</Lencana>
              </td>
              <td className="text-ink">76.0</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-10 mb-16">
        <h2 className="font-heading text-xl font-bold text-ink">Kartu</h2>
        <div className="mt-4 max-w-sm rounded-lg border border-border p-4 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
          <p className="font-heading text-lg font-semibold text-ink">Judul kartu</p>
          <p className="mt-1 text-sm text-muted">
            Bayangan lembut ini meniru <code>--box-shadow</code> di style.css UIKA.
          </p>
          <div className="mt-3">
            <Tombol variant="primer" className="w-full">
              Aksi utama
            </Tombol>
          </div>
        </div>
      </section>
    </main>
  );
}
