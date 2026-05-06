import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/import-batches/[id]">
) {
  const { id } = await ctx.params;

  // Delete all interactions linked to this batch, then the batch itself
  await prisma.interaction.deleteMany({ where: { importBatchId: id } });
  await prisma.importBatch.delete({ where: { id } });

  return Response.json({ ok: true });
}
