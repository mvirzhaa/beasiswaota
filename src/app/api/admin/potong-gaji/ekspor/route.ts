import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ambilDaftarPotonganBulanBerjalan } from "@/server/queries/potong-gaji";
import { buatXlsxEksporPotongan } from "@/lib/potong-gaji/xlsx-io";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const daftar = await ambilDaftarPotonganBulanBerjalan();
  const buffer = await buatXlsxEksporPotongan(
    daftar.map((j) => ({
      jadwalBayarId: j.id,
      nip: j.komitmen.ortuAsuh.nip ?? "",
      namaDonatur: j.komitmen.ortuAsuh.atasNamaMunfiq || j.komitmen.ortuAsuh.nama,
      periodeKode: j.periode.kode,
      nominal: j.nominal,
    })),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="potongan-gaji-${new Date().toISOString().slice(0, 7)}.xlsx"`,
    },
  });
}
