import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(deals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { companyName, stage, sector, checkSize, source, thesis } = body;

  if (!companyName?.trim()) {
    return Response.json({ error: "Company name is required" }, { status: 400 });
  }

  const deal = await prisma.deal.create({
    data: {
      companyName: companyName.trim(),
      stage: stage ?? "SOURCING",
      sector: sector?.trim() || null,
      checkSize: checkSize?.trim() || null,
      source: source?.trim() || null,
      thesis: thesis?.trim() || null,
    },
  });

  return Response.json(deal, { status: 201 });
}
