import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { traceCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
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

  return NextResponse.json(data, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, traceCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const traceNumber = await getNextNumber("TRC");

  const record = await prisma.traceRecord.create({
    data: {
      traceNumber,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      stages: body.stages
        ? {
            create: body.stages.map((s: { stageOrder: number; stageName: string; stageDate: string; location?: string; quantity?: number; note?: string }) => ({
              stageOrder: s.stageOrder,
              stageName: s.stageName,
              stageDate: new Date(s.stageDate),
              location: s.location,
              quantity: s.quantity,
              note: s.note,
            })),
          }
        : undefined,
    },
    include: {
      stages: { orderBy: { stageOrder: "asc" } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
