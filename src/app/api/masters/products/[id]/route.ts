import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { productUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// GET /api/masters/products/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { name: true, shape: true, color: true, grade: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT /api/masters/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await validateBody(request, productUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const product = await prisma.product.update({
    where: { id },
    data: {
      isIsccEligible: body.isIsccEligible,
      displayName: body.displayName,
    },
    include: { name: true, shape: true, color: true, grade: true },
  });

  return NextResponse.json(product);
}

// DELETE /api/masters/products/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
