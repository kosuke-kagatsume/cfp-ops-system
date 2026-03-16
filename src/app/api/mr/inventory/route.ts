import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { product: { code: { contains: search, mode: "insensitive" } } },
      { product: { name: { name: { contains: search, mode: "insensitive" } } } },
      { warehouse: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const inventories = await prisma.inventory.findMany({
    where,
    include: {
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true, plant: { select: { name: true } } } },
      pickupPartner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(inventories);
}
