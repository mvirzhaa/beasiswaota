import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifikasiCronSecret } from "@/lib/cron-auth";
import { prosesNotifikasiLaporanSemester } from "@/server/actions/proses-laporan-semester";

export async function POST(request: Request) {
  if (!verifikasiCronSecret(request)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const hasil = await prosesNotifikasiLaporanSemester(prisma);
  return NextResponse.json(hasil);
}
