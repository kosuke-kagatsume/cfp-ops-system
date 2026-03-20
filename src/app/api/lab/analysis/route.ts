import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { analysisCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { testItem: { contains: search, mode: "insensitive" } },
      {
        sample: {
          sampleNumber: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.analysisResult.findMany({
    where,
    include: {
      sample: {
        include: {
          product: { include: { name: true } },
        },
      },
    },
    orderBy: { analysisDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.analysisResult.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: data, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(data, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, analysisCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const record = await prisma.analysisResult.create({
    data: {
      sampleId: body.sampleId,
      testItem: body.testItem,
      testMethod: body.testMethod,
      result: body.result,
      unit: body.unit,
      standard: body.standard,
      isPassed: body.isPassed,
      analysisDate: new Date(body.analysisDate),
      analyst: body.analyst,
    },
    include: {
      sample: { include: { product: { include: { name: true } } } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "AnalysisResult", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
