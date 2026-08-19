import type { Prisma } from "@prisma/client";

export interface CatatAuditInput {
  aktorId: string | null;
  aksi: string;
  entitas: string;
  entitasId: string;
  sebelum?: Prisma.InputJsonValue;
  sesudah?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Satu-satunya cara menulis AuditLog. Menerima Prisma transaction client
 * (aturan keras #6) supaya pencatatan audit selalu ikut commit/rollback
 * bersama mutasi yang dicatatnya — tidak pernah tercatat sendirian.
 */
export async function catatAudit(
  tx: Prisma.TransactionClient,
  input: CatatAuditInput,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      aktorId: input.aktorId,
      aksi: input.aksi,
      entitas: input.entitas,
      entitasId: input.entitasId,
      sebelum: input.sebelum,
      sesudah: input.sesudah,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
