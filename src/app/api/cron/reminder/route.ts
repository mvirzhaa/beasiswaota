import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifikasiCronSecret } from "@/lib/cron-auth";
import { prosesReminderJadwalBayar } from "@/server/actions/proses-reminder-jadwal";

export async function POST(request: Request) {
  if (!verifikasiCronSecret(request)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const hasil = await prosesReminderJadwalBayar(prisma);
  return NextResponse.json(hasil);
}
