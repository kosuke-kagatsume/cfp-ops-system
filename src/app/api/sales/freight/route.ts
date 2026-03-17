import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { shipment: { shipmentNumber: { contains: search, mode: "insensitive" } } },
      { carrier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const dispatches = await prisma.dispatch.findMany({
    where,
    include: {
      shipment: {
        select: {
          shipmentNumber: true,
          customer: { select: { name: true } },
        },
      },
      carrier: { select: { name: true } },
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
      vehicleNumber: body.vehicleNumber || null,
      driverName: body.driverName || null,
      freightCost: body.freightCost ?? null,
      dispatchDate: new Date(body.dispatchDate),
      note: body.note || null,
    },
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

  return NextResponse.json(dispatch, { status: 201 });
}
