import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import DealDetail from "@/components/DealDetail";

export const dynamic = "force-dynamic";

export default async function DealPage(props: PageProps<"/deals/[id]">) {
  const { id } = await props.params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          meetings: true,
          contacts: true,
          interactions: true,
          tasks: true,
          documents: true,
        },
      },
    },
  });
  if (!deal) notFound();

  return <DealDetail deal={JSON.parse(JSON.stringify(deal))} />;
}
