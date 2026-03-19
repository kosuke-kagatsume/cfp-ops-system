import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { crProductionUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.crProductionOrder.findUnique({
    where: { id },
    include: {
      plant: { select: { id: true, code: true, name: true } },
      materials: {
        include: {
          crMaterial: { select: { id: true, materialNumber: true, materialName: true, quantity: true } },
        },
      },
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
  const result = await validateBody(request, crProductionUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.plantId !== undefined) data.plantId = body.plantId;
  if (body.orderDate !== undefined) data.orderDate = new Date(body.orderDate);
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.status !== undefined) data.status = body.status;
  if (body.lightOilOutput !== undefined) data.lightOilOutput = body.lightOilOutput;
  if (body.heavyOilOutput !== undefined) data.heavyOilOutput = body.heavyOilOutput;
  if (body.mixedOilOutput !== undefined) data.mixedOilOutput = body.mixedOilOutput;
  if (body.residueOutput !== undefined) data.residueOutput = body.residueOutput;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.crProductionOrder.update({
    where: { id },
    data,
    include: {
      plant: { select: { id: true, code: true, name: true } },
      materials: {
        include: {
          crMaterial: { select: { id: true, materialNumber: true, materialName: true, quantity: true } },
        },
      },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.crProductionOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
