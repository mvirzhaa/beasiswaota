import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { catatAudit } from "@/lib/audit";
import { verifikasiSignatureWebhook } from "@/lib/payment/midtrans";
import { parseGrossAmount } from "@/lib/payment/gross-amount";
import { verifikasiTransaksiInti } from "@/server/actions/verifikasi-transaksi-inti";

const STATUS_SUKSES = new Set(["capture", "settlement"]);
const STATUS_GAGAL = new Set(["deny", "cancel", "expire", "failure"]);

/**
 * Webhook Midtrans Snap. Idempoten lewat Transaksi.refEksternal (unique)
 * dan status guard — aman dipanggil dobel. Nominal TIDAK PERNAH dipercaya
 * langsung dari payload; dicocokkan ke Transaksi yang sudah dibuat saat
 * Snap token diterbitkan (yang nominalnya berasal dari JadwalBayar).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }
  if (!env.MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ error: "Payment gateway belum dikonfigurasi" }, { status: 503 });
  }

  const orderId = String(body.order_id ?? "");
  const statusCode = String(body.status_code ?? "");
  const grossAmount = String(body.gross_amount ?? "");
  const signatureKey = String(body.signature_key ?? "");
  const transactionStatus = String(body.transaction_status ?? "");
  const fraudStatus = typeof body.fraud_status === "string" ? body.fraud_status : null;

  const validSignature = verifikasiSignatureWebhook(
    { orderId, statusCode, grossAmount, signatureKey },
    env.MIDTRANS_SERVER_KEY,
  );
  if (!validSignature) {
    return NextResponse.json({ error: "Signature tidak valid" }, { status: 401 });
  }

  const transaksi = await prisma.transaksi.findUnique({
    where: { refEksternal: orderId },
    include: { jadwalBayar: { select: { id: true, periodeId: true } } },
  });

  if (!transaksi) {
    // orderId seharusnya selalu sudah ada (dibuat saat Snap token
    // diterbitkan). Kalau tidak ketemu, retry Midtrans tidak akan
    // memperbaikinya — balas 200 supaya berhenti mengirim ulang.
    return NextResponse.json({ status: "diabaikan: refEksternal tidak dikenal" });
  }

  if (transaksi.status !== "MENUNGGU_VERIFIKASI") {
    return NextResponse.json({ status: "sudah diproses" });
  }

  if (STATUS_GAGAL.has(transactionStatus)) {
    await prisma.$transaction(async (tx) => {
      const diperbarui = await tx.transaksi.updateMany({
        where: { id: transaksi.id, status: "MENUNGGU_VERIFIKASI" },
        data: { status: "DITOLAK", catatanTolak: `Midtrans: ${transactionStatus}` },
      });
      if (diperbarui.count > 0) {
        await catatAudit(tx, {
          aktorId: null,
          aksi: "transaksi.webhook_gagal",
          entitas: "transaksi",
          entitasId: transaksi.id,
          sesudah: { transactionStatus },
        });
      }
    });
    return NextResponse.json({ status: "ditandai gagal" });
  }

  const dianggapSukses =
    STATUS_SUKSES.has(transactionStatus) && (fraudStatus === null || fraudStatus === "accept");
  if (!dianggapSukses) {
    return NextResponse.json({ status: "menunggu status final" });
  }

  let nominalWebhook: bigint;
  try {
    nominalWebhook = parseGrossAmount(grossAmount);
  } catch {
    return NextResponse.json({ error: "gross_amount tidak valid" }, { status: 400 });
  }

  if (nominalWebhook !== transaksi.nominal) {
    await prisma.$transaction(async (tx) => {
      const diperbarui = await tx.transaksi.updateMany({
        where: { id: transaksi.id, status: "MENUNGGU_VERIFIKASI" },
        data: {
          status: "DITOLAK",
          catatanTolak: `Nominal webhook (${grossAmount}) tidak cocok dengan Transaksi.nominal tercatat`,
        },
      });
      if (diperbarui.count > 0) {
        await catatAudit(tx, {
          aktorId: null,
          aksi: "transaksi.webhook_nominal_tidak_cocok",
          entitas: "transaksi",
          entitasId: transaksi.id,
          sesudah: { nominalWebhook: nominalWebhook.toString(), nominalTercatat: transaksi.nominal.toString() },
        });
      }
    });
    return NextResponse.json({ status: "ditolak: nominal tidak cocok" });
  }

  if (!transaksi.jadwalBayar) {
    return NextResponse.json({ error: "Transaksi ini tidak terkait JadwalBayar" }, { status: 500 });
  }

  const hasil = await verifikasiTransaksiInti(prisma, {
    transaksiId: transaksi.id,
    periodeId: transaksi.jadwalBayar.periodeId,
    nominal: transaksi.nominal,
    jadwalBayarId: transaksi.jadwalBayar.id,
    verifiedById: null,
    keterangan: `Pembayaran Midtrans terverifikasi (order ${orderId})`,
    aktorAuditId: null,
    aksiAudit: "transaksi.webhook_verifikasi",
    tglBayarBaru: new Date(),
  });

  if (!hasil.sukses) {
    return NextResponse.json({ status: "sudah diproses" });
  }
  return NextResponse.json({ status: "terverifikasi" });
}
