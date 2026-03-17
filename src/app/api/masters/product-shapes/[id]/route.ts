import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/masters/product-shapes/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.productShape.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PUT /api/masters/product-shapes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const item = await prisma.productShape.update({
    where: { id },
    data: { name: body.name },
  });

  return NextResponse.json(item);
}

// DELETE /api/masters/product-shapes/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.productShape.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
