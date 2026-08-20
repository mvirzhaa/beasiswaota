import { env } from "../env";
import { formatGrossAmount } from "./gross-amount";
import { verifikasiSignatureWebhook, type PayloadWebhookMidtrans } from "./signature";

const SNAP_URL_SANDBOX = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const SNAP_URL_PRODUCTION = "https://app.midtrans.com/snap/v1/transactions";

function pastikanKunciServerAda(): string {
  if (!env.MIDTRANS_SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY belum diisi di .env — payment gateway belum aktif.");
  }
  return env.MIDTRANS_SERVER_KEY;
}

export interface BuatTransaksiSnapInput {
  orderId: string;
  grossAmount: bigint;
  namaDonatur: string;
  emailDonatur: string;
}

export interface HasilTransaksiSnap {
  token: string;
  redirectUrl: string;
}

/**
 * Buat transaksi Snap Midtrans dari satu JadwalBayar. Dipakai oleh
 * pemanggil yang SUDAH membuat baris Transaksi berstatus
 * MENUNGGU_VERIFIKASI dengan refEksternal = orderId ini — webhook nanti
 * mencocokkan balik lewat refEksternal (lihat POST /api/webhook/payment).
 */
export async function buatTransaksiSnap(
  input: BuatTransaksiSnapInput,
): Promise<HasilTransaksiSnap> {
  const serverKey = pastikanKunciServerAda();
  const url = env.MIDTRANS_IS_PRODUCTION ? SNAP_URL_PRODUCTION : SNAP_URL_SANDBOX;
  const auth = Buffer.from(`${serverKey}:`).toString("base64");

  const respons = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: Number(input.grossAmount),
      },
      customer_details: {
        first_name: input.namaDonatur,
        email: input.emailDonatur,
      },
    }),
  });

  if (!respons.ok) {
    const teks = await respons.text().catch(() => "");
    throw new Error(`Midtrans Snap API gagal (${respons.status}): ${teks}`);
  }

  const data = (await respons.json()) as { token: string; redirect_url: string };
  return { token: data.token, redirectUrl: data.redirect_url };
}

export { formatGrossAmount, verifikasiSignatureWebhook, type PayloadWebhookMidtrans };
