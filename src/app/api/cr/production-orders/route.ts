import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const orders = await prisma.crProductionOrder.findMany({
    where,
    include: {
      plant: { select: { id: true, code: true, name: true } },
      materials: {
        include: {
          crMaterial: {
            select: { id: true, materialNumber: true, materialName: true, quantity: true },
          },
        },
      },
    },
    orderBy: { orderDate: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const seq = await prisma.numberSequence.upsert({
    where: { prefix_year: { prefix: "CRP", year: new Date().getFullYear() } },
    update: { currentNumber: { increment: 1 } },
    create: { prefix: "CRP", year: new Date().getFullYear(), currentNumber: 1 },
  });
  const orderNumber = `CRP-${seq.year}-${String(seq.currentNumber).padStart(4, "0")}`;

  const record = await prisma.crProductionOrder.create({
    data: {
      orderNumber,
      plantId: body.plantId,
      orderDate: new Date(body.orderDate),
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      status: body.status ?? "INSTRUCTED",
      note: body.note,
    },
    include: {
      plant: { select: { id: true, code: true, name: true } },
      materials: {
        include: {
          crMaterial: { select: { id: true, materialNumber: true, materialName: true, quantity: true } },
        },
      },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
