import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { processingCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.processingOrder.findMany({
    where,
    include: {
      plant: { select: { id: true, code: true, name: true } },
      inputProduct: { include: { name: true, shape: true, color: true, grade: true } },
      outputProduct: { include: { name: true, shape: true, color: true, grade: true } },
    },
    orderBy: { orderDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.processingOrder.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: orders, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(orders, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, processingCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const orderNumber = await getNextNumber("PRC");

  const order = await prisma.processingOrder.create({
    data: {
      orderNumber,
      plantId: body.plantId,
      processType: body.processType,
      inputProductId: body.inputProductId,
      inputQuantity: body.inputQuantity,
      outputProductId: body.outputProductId,
      orderDate: new Date(body.orderDate),
      status: "PLANNED",
    },
    include: {
      plant: { select: { id: true, code: true, name: true } },
      inputProduct: { include: { name: true } },
      outputProduct: { include: { name: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "ProcessingOrder", recordId: order.id, newData: order });

  return NextResponse.json(order, { status: 201 });
});
