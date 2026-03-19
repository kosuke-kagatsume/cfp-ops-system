import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { quotationUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true } },
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
  const result = await validateBody(request, quotationUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const data: Record<string, unknown> = {};
  if (body.customerId !== undefined) data.customerId = body.customerId;
  if (body.quotationDate !== undefined) data.quotationDate = new Date(body.quotationDate);
  if (body.validUntil !== undefined) data.validUntil = body.validUntil ? new Date(body.validUntil) : null;
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.items !== undefined) data.items = body.items;
  if (body.subtotal !== undefined) data.subtotal = body.subtotal;
  if (body.taxAmount !== undefined) data.taxAmount = body.taxAmount;
  if (body.total !== undefined) data.total = body.total;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.status !== undefined) data.status = body.status;
  if (body.note !== undefined) data.note = body.note;

  const record = await prisma.quotation.update({ where: { id }, data });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Soft delete
  await prisma.quotation.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
