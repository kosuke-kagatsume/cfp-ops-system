import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { crMaterialCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { materialNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
      { materialName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [materials, total] = await Promise.all([
    prisma.crMaterial.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { arrivalDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.crMaterial.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: materials, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(materials, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, crMaterialCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  // 採番
  const materialNumber = await getNextNumber("CRM");

  const record = await prisma.crMaterial.create({
    data: {
      materialNumber,
      supplierId: body.supplierId,
      materialName: body.materialName,
      quantity: body.quantity,
      arrivalDate: new Date(body.arrivalDate),
      inspectionDate: body.inspectionDate ? new Date(body.inspectionDate) : undefined,
      status: body.status ?? "PENDING",
      chlorineContent: body.chlorineContent,
      moistureContent: body.moistureContent,
      foreignMatter: body.foreignMatter,
      note: body.note,
    },
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "CrMaterial", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
