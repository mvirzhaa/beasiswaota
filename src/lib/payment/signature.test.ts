import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifikasiSignatureWebhook } from "./signature";

const SERVER_KEY = "SB-Mid-server-rahasia";

function buatSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string) {
  return createHash("sha512").update(orderId + statusCode + grossAmount + serverKey).digest("hex");
}

describe("verifikasiSignatureWebhook", () => {
  it("menerima signature yang benar", () => {
    const payload = {
      orderId: "jadwal-abc123-1700000000000",
      statusCode: "200",
      grossAmount: "150000.00",
      signatureKey: buatSignature("jadwal-abc123-1700000000000", "200", "150000.00", SERVER_KEY),
    };
    expect(verifikasiSignatureWebhook(payload, SERVER_KEY)).toBe(true);
  });

  it("menolak signature yang salah", () => {
    const payload = {
      orderId: "jadwal-abc123-1700000000000",
      statusCode: "200",
      grossAmount: "150000.00",
      signatureKey: "signature-palsu",
    };
    expect(verifikasiSignatureWebhook(payload, SERVER_KEY)).toBe(false);
  });

  it("menolak kalau nominal di payload berbeda dari yang ditandatangani (deteksi tampering)", () => {
    const signatureAsli = buatSignature("jadwal-abc123-1700000000000", "200", "150000.00", SERVER_KEY);
    const payloadDimanipulasi = {
      orderId: "jadwal-abc123-1700000000000",
      statusCode: "200",
      grossAmount: "999999.00",
      signatureKey: signatureAsli,
    };
    expect(verifikasiSignatureWebhook(payloadDimanipulasi, SERVER_KEY)).toBe(false);
  });

  it("menolak kalau serverKey berbeda", () => {
    const payload = {
      orderId: "jadwal-abc123-1700000000000",
      statusCode: "200",
      grossAmount: "150000.00",
      signatureKey: buatSignature("jadwal-abc123-1700000000000", "200", "150000.00", SERVER_KEY),
    };
    expect(verifikasiSignatureWebhook(payload, "server-key-lain")).toBe(false);
  });
});
