import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { freightUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.dispatch.findUnique({
    where: { id },
    include: {
      shipment: {
        select: {
          shipmentNumber: true,
          customer: { select: { name: true } },
        },
      },
      carrier: { select: { name: true } },
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
  const result = await validateBody(request, freightUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const data: Record<string, unknown> = {};
  if (body.carrierId !== undefined) data.carrierId = body.carrierId;
  if (body.vehicleNumber !== undefined) data.vehicleNumber = body.vehicleNumber;
  if (body.driverName !== undefined) data.driverName = body.driverName;
  if (body.freightCost !== undefined) data.freightCost = body.freightCost;
  if (body.dispatchDate !== undefined) data.dispatchDate = new Date(body.dispatchDate);
  if (body.note !== undefined) data.note = body.note;

  const record = await prisma.dispatch.update({ where: { id }, data });
  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // Soft delete
  await prisma.dispatch.update({ where: { id }, data: { deletedAt: new Date() } });
    await createAuditLog({ action: "UPDATE", tableName: "Freight", recordId: id });

  return NextResponse.json({ success: true });
});
