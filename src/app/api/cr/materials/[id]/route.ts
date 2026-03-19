import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { crMaterialUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.crMaterial.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await validateBody(request, crMaterialUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.supplierId !== undefined) data.supplierId = body.supplierId;
  if (body.materialName !== undefined) data.materialName = body.materialName;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.arrivalDate !== undefined) data.arrivalDate = new Date(body.arrivalDate);
  if (body.inspectionDate !== undefined) data.inspectionDate = body.inspectionDate ? new Date(body.inspectionDate) : null;
  if (body.status !== undefined) data.status = body.status;
  if (body.chlorineContent !== undefined) data.chlorineContent = body.chlorineContent;
  if (body.moistureContent !== undefined) data.moistureContent = body.moistureContent;
  if (body.foreignMatter !== undefined) data.foreignMatter = body.foreignMatter || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.crMaterial.update({
    where: { id },
    data,
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.crMaterial.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
