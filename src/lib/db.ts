import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import fs from "fs";
import path from "path";

function resolveDbPath() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!isServerless) {
    return path.join(process.cwd(), "dev.db");
  }
  const runtimeDb = "/tmp/dev.db";
  if (!fs.existsSync(runtimeDb)) {
    const seedDb = path.join(process.cwd(), "prisma", "seed.db");
    fs.copyFileSync(seedDb, runtimeDb);
  }
  return runtimeDb;
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: `file:${resolveDbPath()}` });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
