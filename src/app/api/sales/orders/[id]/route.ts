import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      items: {
        include: {
          product: { include: { name: true, shape: true, color: true, grade: true } },
        },
      },
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
  if (body.customerId !== undefined) data.customerId = body.customerId;
  if (body.orderDate !== undefined) data.orderDate = new Date(body.orderDate);
  if (body.deliveryDate !== undefined) data.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null;
  if (body.status !== undefined) data.status = body.status;
  if (body.subtotal !== undefined) data.subtotal = body.subtotal;
  if (body.taxAmount !== undefined) data.taxAmount = body.taxAmount;
  if (body.total !== undefined) data.total = body.total;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.note !== undefined) data.note = body.note;

  const record = await prisma.salesOrder.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, code: true, name: true } },
      items: {
        include: {
          product: { include: { name: true } },
        },
      },
    },
  });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Delete items first, then the order
  await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
  await prisma.salesOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
