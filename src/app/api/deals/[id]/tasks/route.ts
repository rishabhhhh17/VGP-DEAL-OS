import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/tasks">
) {
  const { id } = await ctx.params;

  // Auto-move overdue active tasks to BACKLOG
  const now = new Date();
  await prisma.task.updateMany({
    where: {
      dealId: id,
      status: { in: ["TODO", "IN_PROGRESS"] },
      dueDate: { lt: now },
    },
    data: { status: "BACKLOG" },
  });

  const tasks = await prisma.task.findMany({
    where: { dealId: id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });

  return Response.json(tasks);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/tasks">
) {
  const { id: dealId } = await ctx.params;
  const body = await request.json();
  const { title, priority, status, dueDate } = body;

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      dealId,
      title: title.trim(),
      priority: priority ?? "MEDIUM",
      status: status ?? "TODO",
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return Response.json(task, { status: 201 });
}
