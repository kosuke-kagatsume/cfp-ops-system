import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { simpleNameUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// GET /api/masters/product-colors/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.productColor.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PUT /api/masters/product-colors/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await validateBody(request, simpleNameUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const item = await prisma.productColor.update({
    where: { id },
    data: { name: body.name },
  });

  return NextResponse.json(item);
}

// DELETE /api/masters/product-colors/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.productColor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
