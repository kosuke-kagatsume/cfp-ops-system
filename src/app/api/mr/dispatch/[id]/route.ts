import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { dispatchUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.dispatch.findUnique({
    where: { id },
    include: {
      shipment: {
        select: {
          shipmentNumber: true,
          customer: { select: { name: true } },
          product: { include: { name: true } },
          quantity: true,
        },
      },
      carrier: { select: { id: true, code: true, name: true } },
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
  const result = await validateBody(request, dispatchUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.shipmentId !== undefined) data.shipmentId = body.shipmentId;
  if (body.carrierId !== undefined) data.carrierId = body.carrierId;
  if (body.vehicleNumber !== undefined) data.vehicleNumber = body.vehicleNumber || null;
  if (body.driverName !== undefined) data.driverName = body.driverName || null;
  if (body.freightCost !== undefined) data.freightCost = body.freightCost;
  if (body.dispatchDate !== undefined) data.dispatchDate = new Date(body.dispatchDate);
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.dispatch.update({
    where: { id },
    data,
    include: {
      shipment: {
        select: {
          shipmentNumber: true,
          customer: { select: { name: true } },
          product: { include: { name: true } },
          quantity: true,
        },
      },
      carrier: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.dispatch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
