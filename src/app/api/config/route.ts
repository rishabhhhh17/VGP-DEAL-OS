import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.config.findMany();
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    try { result[row.id] = JSON.parse(row.value); }
    catch { result[row.id] = row.value; }
  }
  return Response.json(result);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const updates: Promise<unknown>[] = [];

  for (const [key, value] of Object.entries(body)) {
    updates.push(
      prisma.config.upsert({
        where: { id: key },
        update: { value: JSON.stringify(value) },
        create: { id: key, value: JSON.stringify(value) },
      })
    );
  }

  await Promise.all(updates);
  return Response.json({ ok: true });
}
