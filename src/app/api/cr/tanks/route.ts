import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { tankCreate } from "@/lib/schemas";
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
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tanks, total] = await Promise.all([
    prisma.tank.findMany({
    where,
    include: {
      plant: { select: { id: true, code: true, name: true } },
    },
    orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.tank.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: tanks, total, page, limit });
  }
  return NextResponse.json(tanks);
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, tankCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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
