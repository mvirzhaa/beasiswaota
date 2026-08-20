import { createHash } from "node:crypto";

export interface PayloadWebhookMidtrans {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}

/**
 * Fungsi murni, TIDAK mengimpor env.ts sama sekali (sengaja dipisah dari
 * midtrans.ts) — supaya bisa ditest tanpa perlu seluruh environment
 * aplikasi ter-load. Verifikasi signature_key notifikasi Midtrans: SHA512
 * dari order_id + status_code + gross_amount + ServerKey.
 */
export function verifikasiSignatureWebhook(payload: PayloadWebhookMidtrans, serverKey: string): boolean {
  const hash = createHash("sha512")
    .update(payload.orderId + payload.statusCode + payload.grossAmount + serverKey)
    .digest("hex");
  return hash === payload.signatureKey;
}
