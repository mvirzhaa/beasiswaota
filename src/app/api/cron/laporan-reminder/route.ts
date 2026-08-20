import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifikasiCronSecret } from "@/lib/cron-auth";
import { prosesLaporanReminder } from "@/server/actions/proses-laporan-reminder";

export async function POST(request: Request) {
  if (!verifikasiCronSecret(request)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const hasil = await prosesLaporanReminder(prisma);
  return NextResponse.json(hasil);
}
