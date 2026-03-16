import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { sampleNumber: { contains: search, mode: "insensitive" } },
      { sampleName: { contains: search, mode: "insensitive" } },
    ];
  }

  const data = await prisma.labSample.findMany({
    where,
    include: {
      product: {
        include: { name: true },
      },
      _count: {
        select: { analysisResults: true },
      },
    },
    orderBy: { receivedDate: "desc" },
  });

  return NextResponse.json(data);
}
