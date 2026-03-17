import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

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

  const [orders, total] = await Promise.all([
    prisma.crProductionOrder.findMany({
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
      skip,
      take: limit,
    }),
    prisma.crProductionOrder.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: orders, total, page, limit });
  }
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const orderNumber = await getNextNumber("CRP");

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
