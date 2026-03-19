import { prisma } from "@/lib/db";
import { calculateInvoiceBalance } from "@/lib/invoice";
import { validateBody } from "@/lib/validate";
import { invoiceUpdate } from "@/lib/schemas";
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
  const result = await validateBody(request, invoiceUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

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

  // Save field-level updates first
  await prisma.invoice.update({ where: { id }, data });

  // Recalculate carry-forward balance using centralized logic
  await calculateInvoiceBalance(id);

  const record = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      revenues: { select: { id: true, revenueNumber: true, amount: true } },
    },
  });
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
