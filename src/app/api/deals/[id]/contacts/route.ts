import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/contacts">
) {
  const { id } = await ctx.params;
  const contacts = await prisma.contact.findMany({
    where: { dealId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(contacts);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/contacts">
) {
  const { id: dealId } = await ctx.params;
  const body = await request.json();
  const { name, role, email, linkedin, notes } = body;

  if (!name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      dealId,
      name: name.trim(),
      role: role?.trim() || null,
      email: email?.trim() || null,
      linkedin: linkedin?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return Response.json(contact, { status: 201 });
}
