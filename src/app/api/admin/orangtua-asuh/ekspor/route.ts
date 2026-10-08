import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ambilDaftarOrtuAsuhAdmin } from "@/server/queries/ortu-asuh";
import { buatXlsxEksporDonatur } from "@/lib/ortu-asuh/xlsx-io";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const cari = request.nextUrl.searchParams.get("cari") ?? undefined;
  const daftar = await ambilDaftarOrtuAsuhAdmin({ cari });

  const buffer = await buatXlsxEksporDonatur(
    daftar.map((o) => ({
      nama: o.atasNamaMunfiq || o.nama,
      noHp: o.noHp,
      tipe: o.tipe,
      instansi: o.instansi,
      mahasiswaBinaan: o._count.relasiAsuh,
      komitmenAktif: o.komitmen.filter((k) => k.status === "AKTIF").length,
      komitmenMenunggu: o.komitmen.filter((k) => k.status === "MENUNGGU_KONFIRMASI").length,
      nominalKomitmenAktif: o.komitmen
        .filter((k) => k.status === "AKTIF")
        .reduce((total, k) => total + k.nominalPerPeriode, 0n),
    })),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="donatur-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
