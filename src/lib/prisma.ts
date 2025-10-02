import { PrismaClient } from "@prisma/client";

// Extend NodeJS global type to store PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use existing Prisma client if available (singleton pattern)
export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}