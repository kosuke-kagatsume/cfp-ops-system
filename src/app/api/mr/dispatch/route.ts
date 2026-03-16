import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const dispatches = await prisma.dispatch.findMany({
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
    orderBy: { dispatchDate: "desc" },
  });

  return NextResponse.json(dispatches);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const dispatch = await prisma.dispatch.create({
    data: {
      shipmentId: body.shipmentId,
      carrierId: body.carrierId,
      vehicleNumber: body.vehicleNumber,
      driverName: body.driverName,
      freightCost: body.freightCost,
      dispatchDate: new Date(body.dispatchDate),
      note: body.note,
    },
    include: {
      shipment: { select: { shipmentNumber: true } },
      carrier: { select: { name: true } },
    },
  });

  return NextResponse.json(dispatch, { status: 201 });
}
