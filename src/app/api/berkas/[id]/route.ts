import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cekAksesBerkas } from "@/server/queries/pengajuan";
import { buatUrlTerlindungi } from "@/lib/storage/minio";

// Titik IDOR paling rawan (CLAUDE.md aturan keras #7): otorisasi dicek
// ULANG di sini tiap request, bukan cuma diasumsikan dari halaman yang
// menampilkan link ini. Signed URL berumur 5 menit, bucket tetap privat.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  const { id } = await params;
  const akses = await cekAksesBerkas(id, {
    id: session.user.id,
    role: session.user.role,
  });

  if (!akses) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  const url = await buatUrlTerlindungi(akses.berkas.objectKey);
  return NextResponse.redirect(url);
}
