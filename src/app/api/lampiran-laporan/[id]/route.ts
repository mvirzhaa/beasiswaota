import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cekAksesLampiranLaporan } from "@/server/queries/laporan-perkembangan";
import { buatUrlTerlindungi } from "@/lib/storage/minio";

// Titik IDOR (CLAUDE.md aturan keras #7): otorisasi dicek ULANG di sini
// tiap request — pemilik, admin, atau pembina yang disetujui & diizinkan.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  const { id } = await params;
  const akses = await cekAksesLampiranLaporan(id, {
    id: session.user.id,
    role: session.user.role,
  });

  if (!akses || !akses.laporan.lampiranKey) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  const url = await buatUrlTerlindungi(akses.laporan.lampiranKey);
  return NextResponse.redirect(url);
}
