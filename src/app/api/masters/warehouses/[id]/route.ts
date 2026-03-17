import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/masters/warehouses/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: { plant: true },
  });

  if (!warehouse) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(warehouse);
}

// PUT /api/masters/warehouses/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const warehouse = await prisma.warehouse.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      plantId: body.plantId || null,
      address: body.address,
      capacity: body.capacity,
    },
  });

  return NextResponse.json(warehouse);
}

// DELETE /api/masters/warehouses/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.warehouse.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
