import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { laboratoryName: { contains: search, mode: "insensitive" } },
      {
        sample: {
          sampleNumber: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [data, total] = await Promise.all([
    prisma.externalAnalysis.findMany({
    where,
    include: {
      sample: true,
    },
    orderBy: { requestDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.externalAnalysis.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: data, total, page, limit });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const record = await prisma.externalAnalysis.create({
    data: {
      sampleId: body.sampleId,
      laboratoryName: body.laboratoryName,
      requestDate: new Date(body.requestDate),
      resultDate: body.resultDate ? new Date(body.resultDate) : undefined,
      reportPath: body.reportPath,
      cost: body.cost,
      note: body.note,
    },
    include: { sample: true },
  });

  return NextResponse.json(record, { status: 201 });
}
