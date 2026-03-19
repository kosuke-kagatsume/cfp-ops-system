import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { plantUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

// GET /api/masters/plants/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const plant = await prisma.plant.findUnique({
    where: { id },
    include: { warehouses: true, tanks: true },
  });

  if (!plant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(plant);
}

// PUT /api/masters/plants/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await validateBody(request, plantUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const plant = await prisma.plant.update({
    where: { id },
    data: {
      name: body.name,
      companyId: body.companyId,
      address: body.address,
      tel: body.tel,
    },
  });

  return NextResponse.json(plant);
}

// DELETE /api/masters/plants/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.plant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
