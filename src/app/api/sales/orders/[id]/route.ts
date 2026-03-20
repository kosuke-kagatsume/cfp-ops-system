import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { salesOrderUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
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
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, salesOrderUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

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
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // Delete items first, then the order
  await createAuditLog({ action: "DELETE", tableName: "SalesOrder", recordId: id });
  await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
  await prisma.salesOrder.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
