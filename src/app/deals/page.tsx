import { prisma } from "@/lib/db";
import PipelineBoard from "@/components/PipelineBoard";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true, interactions: true } },
      interactions: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
      screeningResults: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { overallScore: true, fitLevel: true },
      },
    },
  });

  return <PipelineBoard deals={JSON.parse(JSON.stringify(deals))} />;
}
