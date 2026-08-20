import { ambilAkunMenungguVerifikasi } from "@/server/queries/akun";
import { BarisAkunMenunggu } from "./baris-akun-menunggu";
import { FormDaftarkanMahasiswa } from "./form-daftarkan-mahasiswa";

const LABEL_ROLE: Record<string, string> = {
  MAHASISWA: "Mahasiswa",
  ORTU_ASUH: "Orang tua asuh",
};

export default async function HalamanAkunAdmin() {
  const menunggu = await ambilAkunMenungguVerifikasi();

  return (
    <main className="mx-auto mt-6 mb-10 max-w-4xl rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Kelola Akun</h1>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-bold text-ink">
          Menunggu verifikasi ({menunggu.length})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Akun hasil pendaftaran mandiri baru bisa login setelah diaktifkan di sini.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {menunggu.map((u) => (
            <BarisAkunMenunggu
              key={u.id}
              akun={{
                id: u.id,
                email: u.email,
                role: LABEL_ROLE[u.role] ?? u.role,
                nama: u.mahasiswa?.nama ?? u.ortuAsuh?.nama ?? "-",
                keterangan: u.mahasiswa ? `NIM ${u.mahasiswa.nim}` : undefined,
              }}
            />
          ))}
          {menunggu.length === 0 && (
            <p className="text-sm text-muted">Tidak ada akun menunggu verifikasi.</p>
          )}
        </div>
      </section>

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="font-heading text-lg font-bold text-ink">Daftarkan mahasiswa baru</h2>
        <p className="mt-1 text-sm text-muted">
          Untuk camaba yang didaftarkan langsung oleh admin (mis. belum punya akses mandiri).
          NIM boleh diisi sementara dan diperbarui admin setelah NIM resmi terbit. Password
          sementara dibuat sistem dan dikirim ke email mahasiswa.
        </p>
        <FormDaftarkanMahasiswa />
      </section>
    </main>
  );
}
