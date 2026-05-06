import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/interactions">
) {
  const { id } = await ctx.params;
  const interactions = await prisma.interaction.findMany({
    where: { dealId: id },
    include: { deal: { select: { id: true, companyName: true } } },
    orderBy: { date: "desc" },
  });
  return Response.json(interactions);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/interactions">
) {
  const { id: dealId } = await ctx.params;
  const body = await request.json();
  const {
    date, personName, companyName, companyUrl, context,
    mandate, interactionType, origination, referralTouchpoint,
    vgpPoc, outcome, takeaways, nextSteps, deadline,
  } = body;

  if (!personName?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!date) return Response.json({ error: "Date is required" }, { status: 400 });

  const interaction = await prisma.interaction.create({
    data: {
      dealId,
      date: new Date(date),
      personName: personName.trim(),
      companyName: companyName?.trim() || null,
      companyUrl: companyUrl?.trim() || null,
      context: context?.trim() || null,
      mandate: mandate || null,
      interactionType: interactionType || null,
      origination: origination || null,
      referralTouchpoint: referralTouchpoint?.trim() || null,
      vgpPoc: vgpPoc || null,
      outcome: outcome || null,
      takeaways: takeaways?.trim() || null,
      nextSteps: nextSteps?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
    },
    include: { deal: { select: { id: true, companyName: true } } },
  });

  return Response.json(interaction, { status: 201 });
}
