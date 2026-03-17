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

export async function POST(request: NextRequest) {
  const body = await request.json();

  const record = await prisma.tank.create({
    data: {
      code: body.code,
      name: body.name,
      tankType: body.tankType,
      plantId: body.plantId,
      capacity: body.capacity,
      currentLevel: body.currentLevel ?? 0,
    },
    include: {
      plant: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
