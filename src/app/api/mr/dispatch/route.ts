import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [dispatches, total] = await Promise.all([
    prisma.dispatch.findMany({
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
      skip,
      take: limit,
    }),
    prisma.dispatch.count(),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: dispatches, total, page, limit });
  }
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
