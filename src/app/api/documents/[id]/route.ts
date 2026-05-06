import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/documents/[id]">
) {
  const { id } = await ctx.params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  // Delete file from disk
  try {
    await unlink(path.join(process.cwd(), "uploads", doc.filePath));
  } catch {
    // File already gone — continue
  }

  await prisma.document.delete({ where: { id } });
  return Response.json({ ok: true });
}
