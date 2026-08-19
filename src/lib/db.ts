import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient. Next.js dev mode me-reload modul di setiap
// perubahan file; tanpa disimpan di globalThis, tiap reload akan membuka
// koneksi baru ke Postgres sampai kehabisan connection pool.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
