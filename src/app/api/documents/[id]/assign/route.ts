import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/documents/[id]/assign">
) {
  const { id } = await ctx.params;
  const { dealId } = await request.json();

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.document.update({
    where: { id },
    data: { dealId: dealId ?? null },
    include: { deal: { select: { id: true, companyName: true } } },
  });

  return Response.json(updated);
}
