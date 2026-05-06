import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/meetings">
) {
  const { id } = await ctx.params;
  const meetings = await prisma.meeting.findMany({
    where: { dealId: id },
    orderBy: { date: "desc" },
  });
  return Response.json(meetings);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/meetings">
) {
  const { id: dealId } = await ctx.params;
  const body = await request.json();
  const { title, date, duration, transcript, summary, keyTakeaways, risks, nextSteps } = body;

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!date) {
    return Response.json({ error: "Date is required" }, { status: 400 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      dealId,
      title: title.trim(),
      date: new Date(date),
      duration: duration ? Number(duration) : null,
      transcript: transcript?.trim() || null,
      summary: summary?.trim() || null,
      keyTakeaways: keyTakeaways || null,
      risks: risks || null,
      nextSteps: nextSteps || null,
    },
  });

  return Response.json(meeting, { status: 201 });
}
