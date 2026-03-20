import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { crProductionCreate } from "@/lib/schemas";
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
      { orderNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.crProductionOrder.findMany({
    where,
    include: {
      plant: { select: { id: true, code: true, name: true } },
      materials: {
        include: {
          crMaterial: {
            select: { id: true, materialNumber: true, materialName: true, quantity: true },
          },
        },
      },
    },
    orderBy: { orderDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.crProductionOrder.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: orders, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(orders, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, crProductionCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const orderNumber = await getNextNumber("CRP");

  const record = await prisma.crProductionOrder.create({
    data: {
      orderNumber,
      plantId: body.plantId,
      orderDate: new Date(body.orderDate),
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      status: body.status ?? "INSTRUCTED",
      note: body.note,
    },
    include: {
      plant: { select: { id: true, code: true, name: true } },
      materials: {
        include: {
          crMaterial: { select: { id: true, materialNumber: true, materialName: true, quantity: true } },
        },
      },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "CrProductionOrder", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
