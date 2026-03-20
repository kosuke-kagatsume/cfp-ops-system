import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { revenueUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.revenue.findUnique({
    where: { id },
    include: {
      product: { include: { name: true, shape: true, color: true, grade: true } },
      shipment: { select: { shipmentNumber: true, customer: { select: { name: true } } } },
      invoice: { select: { invoiceNumber: true } },
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
  const result = await validateBody(request, revenueUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const data: Record<string, unknown> = {};
  if (body.division !== undefined) data.division = body.division;
  if (body.salesCategory !== undefined) data.salesCategory = body.salesCategory;
  if (body.revenueDate !== undefined) data.revenueDate = new Date(body.revenueDate);
  if (body.billingDate !== undefined) data.billingDate = body.billingDate ? new Date(body.billingDate) : null;
  if (body.shipmentDate !== undefined) data.shipmentDate = body.shipmentDate ? new Date(body.shipmentDate) : null;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.unitPrice !== undefined) data.unitPrice = body.unitPrice;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.taxRate !== undefined) data.taxRate = body.taxRate;
  if (body.taxAmount !== undefined) data.taxAmount = body.taxAmount;
  if (body.isExportExempt !== undefined) data.isExportExempt = body.isExportExempt;
  if (body.note !== undefined) data.note = body.note;
  if (body.productId !== undefined) data.productId = body.productId;
  if (body.customerId !== undefined) data.customerId = body.customerId;
  if (body.shipmentId !== undefined) data.shipmentId = body.shipmentId;

  const record = await prisma.revenue.update({ where: { id }, data });
  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "Revenue", recordId: id });
  await prisma.revenue.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
