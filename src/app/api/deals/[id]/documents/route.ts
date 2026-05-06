import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/documents">
) {
  const { id } = await ctx.params;
  const documents = await prisma.document.findMany({
    where: { dealId: id },
    include: { deal: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(documents);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/deals/[id]/documents">
) {
  const { id: dealId } = await ctx.params;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "OTHER";

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads", dealId);
  await mkdir(uploadsDir, { recursive: true });

  // Sanitise filename and make unique
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}_${safeName}`;
  const filePath = path.join(uploadsDir, uniqueName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const subcategory = (formData.get("subcategory") as string) || null;

  const document = await prisma.document.create({
    data: {
      dealId,
      name: file.name,
      category,
      subcategory,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      filePath: path.join(dealId, uniqueName),
    },
    include: { deal: { select: { id: true, companyName: true } } },
  });

  return Response.json(document, { status: 201 });
}
