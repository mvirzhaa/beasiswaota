import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cekAksesBuktiTransaksi } from "@/server/queries/transaksi";
import { buatUrlTerlindungi } from "@/lib/storage/minio";

// Titik IDOR (CLAUDE.md aturan keras #7): otorisasi dicek ULANG di sini
// tiap request. Signed URL berumur 5 menit, bucket tetap privat.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  }

  const { id } = await params;
  const akses = await cekAksesBuktiTransaksi(id, {
    id: session.user.id,
    role: session.user.role,
  });

  if (!akses || !akses.transaksi.buktiObjectKey) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  const url = await buatUrlTerlindungi(akses.transaksi.buktiObjectKey);
  return NextResponse.redirect(url);
}
