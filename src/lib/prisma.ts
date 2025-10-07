/**
 * Shared Prisma client instance for the Shop4Me app.
 * Uses the generated client (`@/generated/prisma`) and caches the instance
 * in development to avoid exhausting database connections during hot reloads.
 */

import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
