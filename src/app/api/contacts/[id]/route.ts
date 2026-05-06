import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/contacts/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { name, role, email, linkedin, notes } = body;

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(role !== undefined && { role: role?.trim() || null }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(linkedin !== undefined && { linkedin: linkedin?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
  });

  return Response.json(contact);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/contacts/[id]">
) {
  const { id } = await ctx.params;
  await prisma.contact.delete({ where: { id } });
  return Response.json({ ok: true });
}
