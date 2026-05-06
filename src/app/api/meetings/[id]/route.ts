import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/meetings/[id]">
) {
  const { id } = await ctx.params;
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(meeting);
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/meetings/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { title, date, duration, transcript, summary, keyTakeaways, risks, nextSteps } = body;

  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(duration !== undefined && { duration: duration ? Number(duration) : null }),
      ...(transcript !== undefined && { transcript: transcript?.trim() || null }),
      ...(summary !== undefined && { summary: summary?.trim() || null }),
      ...(keyTakeaways !== undefined && { keyTakeaways }),
      ...(risks !== undefined && { risks }),
      ...(nextSteps !== undefined && { nextSteps }),
    },
  });

  return Response.json(meeting);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/meetings/[id]">
) {
  const { id } = await ctx.params;
  await prisma.meeting.delete({ where: { id } });
  return Response.json({ ok: true });
}
