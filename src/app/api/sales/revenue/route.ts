import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const division = searchParams.get("division");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { revenueNumber: { contains: search, mode: "insensitive" } },
      { product: { name: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (division) {
    where.division = division;
  }

  const revenues = await prisma.revenue.findMany({
    where,
    include: {
      product: { include: { name: true, shape: true, color: true, grade: true } },
      shipment: { select: { shipmentNumber: true, customer: { select: { name: true } } } },
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { revenueDate: "desc" },
  });

  return NextResponse.json(revenues);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const revenueNumber = await getNextNumber("REV");

  const amount = (body.quantity ?? 0) * (body.unitPrice ?? 0);
  const taxAmount = body.isExportExempt ? 0 : Math.floor(amount * (body.taxRate ?? 0.1));

  const revenue = await prisma.revenue.create({
    data: {
      revenueNumber,
      division: body.division ?? "MR",
      salesCategory: body.salesCategory ?? "SALES",
      revenueDate: new Date(body.revenueDate),
      billingDate: body.billingDate ? new Date(body.billingDate) : null,
      shipmentDate: body.shipmentDate ? new Date(body.shipmentDate) : null,
      customerId: body.customerId || null,
      productId: body.productId || null,
      shipmentId: body.shipmentId || null,
      quantity: body.quantity ?? null,
      unitPrice: body.unitPrice ?? null,
      amount: body.amount ?? amount,
      taxRate: body.taxRate ?? 0.1,
      taxAmount: body.taxAmount ?? taxAmount,
      isExportExempt: body.isExportExempt ?? false,
      note: body.note || null,
    },
  });

  return NextResponse.json(revenue, { status: 201 });
}
