import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { labSampleCreate } from "@/lib/schemas";
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
      { sampleNumber: { contains: search, mode: "insensitive" } },
      { sampleName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.labSample.findMany({
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
      skip,
      take: limit,
    }),
    prisma.labSample.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: data, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(data, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, labSampleCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const sampleNumber = await getNextNumber("SMP");

  const record = await prisma.labSample.create({
    data: {
      sampleNumber,
      sampleName: body.sampleName,
      productId: body.productId || undefined,
      source: body.source,
      receivedDate: new Date(body.receivedDate),
      status: body.status ?? "RECEIVED",
      note: body.note,
    },
    include: {
      product: { include: { name: true } },
      _count: { select: { analysisResults: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "LabSample", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
