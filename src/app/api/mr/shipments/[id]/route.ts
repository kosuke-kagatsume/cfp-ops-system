import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { shipmentUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.shipment.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      deliveryPartner: { select: { id: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      dispatch: { select: { id: true, carrierId: true, carrier: { select: { name: true } } } },
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
  const result = await validateBody(request, shipmentUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.customerId !== undefined) data.customerId = body.customerId;
  if (body.deliveryPartnerId !== undefined) data.deliveryPartnerId = body.deliveryPartnerId || null;
  if (body.productId !== undefined) data.productId = body.productId;
  if (body.packagingType !== undefined) data.packagingType = body.packagingType || null;
  if (body.warehouseId !== undefined) data.warehouseId = body.warehouseId || null;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.unitPrice !== undefined) data.unitPrice = body.unitPrice;
  if (body.quantity !== undefined && body.unitPrice !== undefined) {
    data.amount = body.quantity * body.unitPrice;
  } else if (body.unitPrice !== undefined || body.quantity !== undefined) {
    // If only one changed, recalculate on server would need current values
    // For simplicity, let the client send both or set amount directly
    if (body.amount !== undefined) data.amount = body.amount;
  }
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.deliveryDate !== undefined) data.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null;
  if (body.shipmentDate !== undefined) data.shipmentDate = body.shipmentDate ? new Date(body.shipmentDate) : null;
  if (body.status !== undefined) data.status = body.status;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.shipment.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, code: true, name: true } },
      deliveryPartner: { select: { id: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      dispatch: { select: { id: true, carrierId: true, carrier: { select: { name: true } } } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.shipment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
