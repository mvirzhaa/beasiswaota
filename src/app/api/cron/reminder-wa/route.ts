import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifikasiCronSecret } from "@/lib/cron-auth";
import { prosesReminderWaBulanan } from "@/server/actions/proses-reminder-wa";

export async function POST(request: Request) {
  if (!verifikasiCronSecret(request)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const hasil = await prosesReminderWaBulanan(prisma);
  return NextResponse.json(hasil);
}
