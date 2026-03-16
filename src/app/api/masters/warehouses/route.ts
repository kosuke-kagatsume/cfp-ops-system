import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const warehouses = await prisma.warehouse.findMany({
    include: { plant: true },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(warehouses);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const warehouse = await prisma.warehouse.create({
    data: {
      code: body.code,
      name: body.name,
      type: body.type ?? "INTERNAL",
      plantId: body.plantId,
      address: body.address,
      capacity: body.capacity,
    },
  });

  return NextResponse.json(warehouse, { status: 201 });
}
