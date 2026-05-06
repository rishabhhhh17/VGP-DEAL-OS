import { prisma } from "@/lib/db";

export async function GET() {
  const batches = await prisma.importBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: { _count: { select: { interactions: true } } },
  });
  return Response.json(batches);
}
