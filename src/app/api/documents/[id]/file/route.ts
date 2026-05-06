import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/documents/[id]/file">
) {
  const { id } = await ctx.params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  try {
    const filePath = path.join(process.cwd(), "uploads", doc.filePath);
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return Response.json({ error: "File not found on disk" }, { status: 404 });
  }
}
