import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      revenues: { select: { id: true, revenueNumber: true, amount: true } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.customerId !== undefined) data.customerId = body.customerId;
  if (body.billingDate !== undefined) data.billingDate = new Date(body.billingDate);
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.closingDay !== undefined) data.closingDay = body.closingDay;
  if (body.status !== undefined) data.status = body.status;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.note !== undefined) data.note = body.note;

  // Recalculate carry-forward balance if relevant fields are provided
  if (body.prevBalance !== undefined) data.prevBalance = body.prevBalance;
  if (body.paymentReceived !== undefined) data.paymentReceived = body.paymentReceived;
  if (body.subtotal !== undefined) data.subtotal = body.subtotal;
  if (body.taxAmount !== undefined) data.taxAmount = body.taxAmount;

  // Server-side calculation
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (existing) {
    const prevBalance = (data.prevBalance as number) ?? existing.prevBalance;
    const paymentRcv = (data.paymentReceived as number) ?? existing.paymentReceived;
    const subtotal = (data.subtotal as number) ?? existing.subtotal;
    const taxAmount = (data.taxAmount as number) ?? existing.taxAmount;
    data.carryover = prevBalance - paymentRcv;
    data.total = (prevBalance - paymentRcv) + subtotal + taxAmount;
  }

  const record = await prisma.invoice.update({ where: { id }, data });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
