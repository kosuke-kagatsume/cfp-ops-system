import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { getPreviousBalance } from "@/lib/invoice";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

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

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: { select: { id: true, code: true, name: true } },
      revenues: { select: { id: true, revenueNumber: true, amount: true } },
    },
    orderBy: { billingDate: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

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
