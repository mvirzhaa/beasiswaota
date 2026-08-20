import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ambilPesanRelasiUntukUser } from "@/server/queries/pesan-binaan";
import { FormKirimPesan } from "./form-kirim-pesan";

export default async function HalamanThreadPesanDonatur({
  params,
}: {
  params: Promise<{ relasiId: string }>;
}) {
  const { relasiId } = await params;
  const session = await auth();

  const hasil = await ambilPesanRelasiUntukUser(relasiId, {
    id: session!.user.id,
    role: session!.user.role,
  });
  if (!hasil) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl mt-6 mb-10 rounded-lg border border-border bg-surface p-6 shadow-[0_0_40px_5px_rgb(0_0_0_/_5%)]">
      <h1 className="font-heading text-2xl font-bold text-ink">Pesan — {hasil.relasi.mahasiswa.nama}</h1>

      <div className="mt-4 flex flex-col gap-2">
        {hasil.pesan.map((p) => (
          <div key={p.id} className="rounded border p-2 text-sm">
            <p>{p.isi}</p>
            <p className="text-xs text-muted">
              {p.createdAt.toLocaleString("id-ID")} · {p.status}
              {p.status === "DITOLAK" && p.alasanTolak ? ` — ${p.alasanTolak}` : ""}
            </p>
          </div>
        ))}
        {hasil.pesan.length === 0 && <p className="text-sm text-muted">Belum ada pesan.</p>}
      </div>

      <div className="mt-6">
        <FormKirimPesan relasiId={relasiId} />
      </div>
    </main>
  );
}
