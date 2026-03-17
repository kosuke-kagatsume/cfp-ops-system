import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

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

  const orders = await prisma.salesOrder.findMany({
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
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

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

  return NextResponse.json(order, { status: 201 });
}
