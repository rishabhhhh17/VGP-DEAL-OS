import { prisma } from "@/lib/db";

const BACKLOG_EXCLUDE = ["Mandated", "Pass", "Investing Partners"];

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    activeDeals,
    interactionsThisMonth,
    tasksDueThisWeek,
    mandatedCount,
    backlogRaw,
    recentInteractions,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.deal.count({ where: { stage: { not: "PASSED" } } }),
    prisma.interaction.count({ where: { date: { gte: startOfMonth } } }),
    prisma.task.count({
      where: {
        status: { notIn: ["DONE"] },
        dueDate: { gte: now, lte: weekEnd },
      },
    }),
    prisma.interaction.count({ where: { outcome: "Mandated" } }),
    prisma.interaction.findMany({
      where: { deadline: { not: null } },
      select: { complete: true, outcome: true },
    }),
    prisma.interaction.findMany({
      orderBy: { date: "desc" },
      take: 10,
      select: {
        id: true,
        personName: true,
        companyName: true,
        interactionType: true,
        date: true,
        outcome: true,
        dealId: true,
      },
    }),
    prisma.interaction.findMany({
      where: { deadline: { not: null } },
      orderBy: { deadline: "asc" },
      take: 10,
      select: {
        id: true,
        personName: true,
        companyName: true,
        deadline: true,
        complete: true,
        outcome: true,
      },
    }),
  ]);

  const backlogCount = backlogRaw.filter(
    (i) =>
      i.complete !== true &&
      (!i.outcome || !BACKLOG_EXCLUDE.includes(i.outcome))
  ).length;

  // Filter upcoming deadlines same way
  const filteredDeadlines = upcomingDeadlines
    .filter(
      (i) =>
        i.complete !== true &&
        (!i.outcome || !BACKLOG_EXCLUDE.includes(i.outcome))
    )
    .slice(0, 5);

  return Response.json({
    stats: {
      activeDeals,
      interactionsThisMonth,
      tasksDueThisWeek,
      backlogCount,
      mandatedCount,
    },
    recentInteractions,
    upcomingDeadlines: filteredDeadlines,
  });
}
