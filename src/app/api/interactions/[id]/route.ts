import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/interactions/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const {
    dealId, date, personName, companyName, companyUrl, context,
    mandate, interactionType, origination, referralTouchpoint,
    vgpPoc, outcome, takeaways, nextSteps, deadline,
  } = body;

  const interaction = await prisma.interaction.update({
    where: { id },
    data: {
      ...(dealId !== undefined && { dealId: dealId || null }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(personName !== undefined && { personName: personName.trim() }),
      ...(companyName !== undefined && { companyName: companyName?.trim() || null }),
      ...(companyUrl !== undefined && { companyUrl: companyUrl?.trim() || null }),
      ...(context !== undefined && { context: context?.trim() || null }),
      ...(mandate !== undefined && { mandate: mandate || null }),
      ...(interactionType !== undefined && { interactionType: interactionType || null }),
      ...(origination !== undefined && { origination: origination || null }),
      ...(referralTouchpoint !== undefined && { referralTouchpoint: referralTouchpoint?.trim() || null }),
      ...(vgpPoc !== undefined && { vgpPoc: vgpPoc || null }),
      ...(outcome !== undefined && { outcome: outcome || null }),
      ...(takeaways !== undefined && { takeaways: takeaways?.trim() || null }),
      ...(nextSteps !== undefined && { nextSteps: nextSteps?.trim() || null }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
    },
    include: { deal: { select: { id: true, companyName: true } } },
  });

  return Response.json(interaction);
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/interactions/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const interaction = await prisma.interaction.update({
    where: { id },
    data: { complete: body.complete },
  });
  return Response.json(interaction);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/interactions/[id]">
) {
  const { id } = await ctx.params;
  await prisma.interaction.delete({ where: { id } });
  return Response.json({ ok: true });
}
