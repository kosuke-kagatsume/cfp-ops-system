import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { shipmentNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const shipments = await prisma.oilShipment.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { shipmentDate: "desc" },
  });

  return NextResponse.json(shipments);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const shipmentNumber = await getNextNumber("OIL");

  const record = await prisma.oilShipment.create({
    data: {
      shipmentNumber,
      customerId: body.customerId,
      oilType: body.oilType,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      amount: body.amount ?? (body.quantity && body.unitPrice ? body.quantity * body.unitPrice : undefined),
      shipmentDate: new Date(body.shipmentDate),
      note: body.note,
    },
    include: {
      customer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
