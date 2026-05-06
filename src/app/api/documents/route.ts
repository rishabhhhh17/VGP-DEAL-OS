import { prisma } from "@/lib/db";

export async function GET() {
  const documents = await prisma.document.findMany({
    include: { deal: { select: { id: true, companyName: true } } },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });
  return Response.json(documents);
}
