import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const results = await prisma.screeningResult.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      deal: { select: { id: true, companyName: true } },
    },
  });
  return Response.json(results);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { resultId, dealId } = body;

  if (!resultId) {
    return Response.json({ error: "resultId is required" }, { status: 400 });
  }

  let validDealId: string | null = null;
  if (dealId) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }
    validDealId = dealId;
  }

  const updated = await prisma.screeningResult.update({
    where: { id: resultId },
    data: { dealId: validDealId },
    include: { deal: { select: { id: true, companyName: true } } },
  });

  return Response.json(updated);
}
