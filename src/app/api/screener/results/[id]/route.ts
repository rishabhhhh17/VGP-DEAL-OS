import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await prisma.screeningResult.findUnique({
    where: { id },
    include: { deal: { select: { id: true, companyName: true } } },
  });

  if (!result) {
    return Response.json({ error: "Result not found" }, { status: 404 });
  }

  return Response.json(result);
}
