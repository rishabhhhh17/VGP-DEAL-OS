import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { title, priority, status, dueDate } = body;

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
  });

  return Response.json(task);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">
) {
  const { id } = await ctx.params;
  await prisma.task.delete({ where: { id } });
  return Response.json({ ok: true });
}
