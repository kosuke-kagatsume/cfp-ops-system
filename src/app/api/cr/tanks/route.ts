import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const tanks = await prisma.tank.findMany({
    where,
    include: {
      plant: { select: { id: true, code: true, name: true } },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(tanks);
}
