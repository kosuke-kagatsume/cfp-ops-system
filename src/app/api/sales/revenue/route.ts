import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { generateRevenueJournal } from "@/lib/journal";
import { validateBody } from "@/lib/validate";
import { revenueCreate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const division = searchParams.get("division");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

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

  const [revenues, total] = await Promise.all([
    prisma.revenue.findMany({
    where,
    include: {
      product: { include: { name: true, shape: true, color: true, grade: true } },
      shipment: { select: { shipmentNumber: true, customer: { select: { name: true } } } },
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { revenueDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.revenue.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: revenues, total, page, limit }, { headers: { "Cache-Control": "private, no-cache" } });
  }
  return NextResponse.json(revenues, { headers: { "Cache-Control": "private, no-cache" } });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, revenueCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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

  // 仕訳自動生成
  await generateRevenueJournal({
    id: revenue.id,
    revenueNumber: revenue.revenueNumber,
    revenueDate: revenue.revenueDate,
    amount: revenue.amount,
    taxAmount: revenue.taxAmount,
  });

  return NextResponse.json(revenue, { status: 201 });
}
