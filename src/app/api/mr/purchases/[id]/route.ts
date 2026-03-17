import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      pickupPartner: { select: { id: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true } },
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
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.supplierId !== undefined) data.supplierId = body.supplierId;
  if (body.pickupPartnerId !== undefined) data.pickupPartnerId = body.pickupPartnerId || null;
  if (body.productId !== undefined) data.productId = body.productId;
  if (body.packagingType !== undefined) data.packagingType = body.packagingType || null;
  if (body.warehouseId !== undefined) data.warehouseId = body.warehouseId || null;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.unitPrice !== undefined) data.unitPrice = body.unitPrice;
  if (body.quantity !== undefined && body.unitPrice !== undefined) {
    data.amount = body.quantity * body.unitPrice;
  }
  if (body.freightCost !== undefined) data.freightCost = body.freightCost;
  if (body.purchaseDate !== undefined) data.purchaseDate = new Date(body.purchaseDate);
  if (body.status !== undefined) data.status = body.status;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.purchase.update({
    where: { id },
    data,
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      pickupPartner: { select: { id: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.purchase.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
