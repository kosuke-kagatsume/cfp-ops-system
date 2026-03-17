import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { product: { code: { contains: search, mode: "insensitive" } } },
      { product: { name: { name: { contains: search, mode: "insensitive" } } } },
      { warehouse: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [inventories, total] = await Promise.all([
    prisma.inventory.findMany({
    where,
    include: {
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true, plant: { select: { name: true } } } },
      pickupPartner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.inventory.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: inventories, total, page, limit });
  }
  return NextResponse.json(inventories);
}
