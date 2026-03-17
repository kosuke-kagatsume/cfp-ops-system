import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  const orders = await prisma.processingOrder.findMany({
    where,
    include: {
      plant: { select: { id: true, code: true, name: true } },
      inputProduct: { include: { name: true, shape: true, color: true, grade: true } },
      outputProduct: { include: { name: true, shape: true, color: true, grade: true } },
    },
    orderBy: { orderDate: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const orderNumber = await getNextNumber("PRC");

  const order = await prisma.processingOrder.create({
    data: {
      orderNumber,
      plantId: body.plantId,
      processType: body.processType,
      inputProductId: body.inputProductId,
      inputQuantity: body.inputQuantity,
      outputProductId: body.outputProductId,
      orderDate: new Date(body.orderDate),
      status: "PLANNED",
    },
    include: {
      plant: { select: { id: true, code: true, name: true } },
      inputProduct: { include: { name: true } },
      outputProduct: { include: { name: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}
