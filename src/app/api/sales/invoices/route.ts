import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { getPreviousBalance } from "@/lib/invoice";
import { validateBody } from "@/lib/validate";
import { invoiceCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, code: true, name: true } },
      revenues: { select: { id: true, revenueNumber: true, amount: true } },
    },
    orderBy: { billingDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: invoices, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(invoices, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, invoiceCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const invoiceNumber = await getNextNumber("INV");

  // Auto-set prevBalance from previous invoice if not provided
  const prevBalance = body.prevBalance ?? (body.customerId ? await getPreviousBalance(body.customerId) : 0);
  const paymentRcv = body.paymentReceived ?? 0;
  const subtotal = body.subtotal ?? 0;
  const taxAmount = body.taxAmount ?? 0;
  const carryover = prevBalance - paymentRcv;
  const total = carryover + subtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: body.customerId,
      billingDate: new Date(body.billingDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      closingDay: body.closingDay || null,
      prevBalance,
      paymentReceived: paymentRcv,
      carryover,
      subtotal,
      taxAmount,
      total,
      status: "DRAFT",
      currency: body.currency ?? "JPY",
      note: body.note || null,
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
