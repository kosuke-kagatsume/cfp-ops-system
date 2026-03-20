import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { salesOrderCreate } from "@/lib/schemas";
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

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
    where,
    include: {
      customer: { select: { id: true, code: true, name: true } },
      items: {
        include: {
          product: { include: { name: true, shape: true, color: true, grade: true } },
        },
      },
    },
    orderBy: { orderDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.salesOrder.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: orders, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(orders, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, salesOrderCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const orderNumber = await getNextNumber("SLS");

  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId: body.customerId,
      orderDate: new Date(body.orderDate),
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      subtotal: body.subtotal ?? 0,
      taxAmount: body.taxAmount ?? 0,
      total: body.total ?? 0,
      currency: body.currency ?? "JPY",
      status: "DRAFT",
      items: body.items
        ? {
            create: body.items.map((item: { productId: string; quantity: number; unitPrice: number; taxRate?: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.quantity * item.unitPrice,
              taxRate: item.taxRate ?? 0.1,
            })),
          }
        : undefined,
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      items: { include: { product: { include: { name: true } } } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "SalesOrder", recordId: order.id, newData: order });

  return NextResponse.json(order, { status: 201 });
});
