import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const BACKLOG_EXCLUDE_OUTCOMES = ["Mandated", "Pass", "Investing Partners"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const outcome  = searchParams.get("outcome");
  const mandate  = searchParams.get("mandate");
  const backlog  = searchParams.get("backlog") === "true";

  if (backlog) {
    // Fetch all with a deadline, then filter in JS for correctness with NULLs
    const all = await prisma.interaction.findMany({
      where: { deadline: { not: null } },
      include: { deal: { select: { id: true, companyName: true } } },
      orderBy: { deadline: "asc" },
    });
    const filtered = all.filter(i =>
      i.complete !== true &&
      (!i.outcome || !BACKLOG_EXCLUDE_OUTCOMES.includes(i.outcome))
    );
    return Response.json(filtered);
  }

  const interactions = await prisma.interaction.findMany({
    where: {
      ...(outcome ? { outcome } : {}),
      ...(mandate ? { mandate } : {}),
    },
    include: { deal: { select: { id: true, companyName: true } } },
    orderBy: { date: "desc" },
  });

  return Response.json(interactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    dealId, date, personName, companyName, companyUrl, context,
    mandate, interactionType, origination, referralTouchpoint,
    vgpPoc, outcome, takeaways, nextSteps, deadline,
  } = body;

  if (!personName?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (!date) {
    return Response.json({ error: "Date is required" }, { status: 400 });
  }

  const interaction = await prisma.interaction.create({
    data: {
      dealId: dealId || null,
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
