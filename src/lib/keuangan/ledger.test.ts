import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { hitungSaldo } from "./ledger";

function txPalsu(ledgerTerakhir: { saldoSetelah: bigint } | null) {
  return {
    danaLedger: {
      findFirst: vi.fn().mockResolvedValue(ledgerTerakhir),
    },
  } as unknown as Prisma.TransactionClient;
}

describe("hitungSaldo", () => {
  it("mengembalikan 0 kalau periode belum punya entri ledger sama sekali", async () => {
    const saldo = await hitungSaldo(txPalsu(null), "periode-1");
    expect(saldo).toBe(0n);
  });

  it("mengembalikan saldoSetelah dari entri ledger terakhir", async () => {
    const saldo = await hitungSaldo(txPalsu({ saldoSetelah: 12_500_000n }), "periode-1");
    expect(saldo).toBe(12_500_000n);
  });

  it("query difilter per periodeId dan diurutkan dari yang terbaru", async () => {
    const tx = txPalsu({ saldoSetelah: 1_000n });
    await hitungSaldo(tx, "periode-xyz");
    expect(tx.danaLedger.findFirst).toHaveBeenCalledWith({
      where: { periodeId: "periode-xyz" },
      orderBy: { createdAt: "desc" },
    });
  });
});
