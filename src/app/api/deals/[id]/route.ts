import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/deals/[id]">
) {
  const { id } = await ctx.params;
  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(deal);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/deals/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { companyName, stage, sector, checkSize, source, thesis } = body;

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...(companyName !== undefined && { companyName: companyName.trim() }),
      ...(stage !== undefined && { stage }),
      ...(sector !== undefined && { sector: sector?.trim() || null }),
      ...(checkSize !== undefined && { checkSize: checkSize?.trim() || null }),
      ...(source !== undefined && { source: source?.trim() || null }),
      ...(thesis !== undefined && { thesis: thesis?.trim() || null }),
    },
  });

  return Response.json(deal);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/deals/[id]">
) {
  const { id } = await ctx.params;
  await prisma.deal.delete({ where: { id } });
  return Response.json({ ok: true });
}
