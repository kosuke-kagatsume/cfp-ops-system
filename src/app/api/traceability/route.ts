import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { traceNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const data = await prisma.traceRecord.findMany({
    where,
    include: {
      stages: { orderBy: { stageOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(data);
}
