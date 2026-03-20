import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { oilShipmentUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.oilShipment.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
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
  const result = await validateBody(request, oilShipmentUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.customerId !== undefined) data.customerId = body.customerId;
  if (body.oilType !== undefined) data.oilType = body.oilType;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.unitPrice !== undefined) data.unitPrice = body.unitPrice;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.shipmentDate !== undefined) data.shipmentDate = new Date(body.shipmentDate);
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.oilShipment.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "OilShipment", recordId: id });
  await prisma.oilShipment.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
