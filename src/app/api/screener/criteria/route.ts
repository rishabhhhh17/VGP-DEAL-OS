import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const criteria = await prisma.screenerCriteria.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return Response.json(criteria ?? null);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    fundMandate,
    sectorPrefs,
    teamRequirements,
    tractionReqs,
    marketSize,
    dealStructure,
    redFlags,
    otherCriteria,
  } = body;

  const existing = await prisma.screenerCriteria.findFirst();

  const data = {
    fundMandate: fundMandate?.trim() || null,
    sectorPrefs: sectorPrefs?.trim() || null,
    teamRequirements: teamRequirements?.trim() || null,
    tractionReqs: tractionReqs?.trim() || null,
    marketSize: marketSize?.trim() || null,
    dealStructure: dealStructure?.trim() || null,
    redFlags: redFlags?.trim() || null,
    otherCriteria: otherCriteria?.trim() || null,
  };

  let criteria;
  if (existing) {
    criteria = await prisma.screenerCriteria.update({
      where: { id: existing.id },
      data,
    });
  } else {
    criteria = await prisma.screenerCriteria.create({ data });
  }

  return Response.json(criteria);
}
