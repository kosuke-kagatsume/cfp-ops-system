import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany({

    include: { plant: true },
    orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.warehouse.count(),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: warehouses, total, page, limit }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  }
  return NextResponse.json(warehouses, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
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
