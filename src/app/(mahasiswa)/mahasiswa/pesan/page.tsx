import Link from "next/link";
import { auth } from "@/lib/auth";
import { ambilRelasiUntukPesanMahasiswa } from "@/server/queries/pesan-binaan";

export default async function HalamanDaftarPesanMahasiswa() {
  const session = await auth();
  const relasiList = await ambilRelasiUntukPesanMahasiswa(session!.user.id);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">Pesan</h1>
      <p className="mt-1 text-sm text-gray-600">
        Semua pesan dimoderasi admin sebelum tersampaikan. Jangan cantumkan nomor telepon atau
        email — pesan seperti itu otomatis ditolak.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {relasiList.map((r) => (
          <Link
            key={r.id}
            href={`/mahasiswa/pesan/${r.id}`}
            className="rounded border p-3 text-sm underline"
          >
            {r.ortuAsuh.anonim ? "Donatur (anonim)" : r.ortuAsuh.atasNamaMunfiq || r.ortuAsuh.nama}
          </Link>
        ))}
        {relasiList.length === 0 && (
          <p className="text-sm text-gray-500">
            Belum ada pembina yang bisa dikirimi pesan (perlu relasi aktif dan sudah Anda setujui).
          </p>
        )}
      </div>
    </main>
  );
}
