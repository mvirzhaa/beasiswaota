import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifikasiCronSecret } from "@/lib/cron-auth";
import { generateJadwalBerikutnyaUntukSemuaKomitmen } from "@/server/actions/generate-jadwal-berikutnya";

export async function POST(request: Request) {
  if (!verifikasiCronSecret(request)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const hasil = await generateJadwalBerikutnyaUntukSemuaKomitmen(prisma);
  return NextResponse.json(hasil);
}
