import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { ctsUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.ctsTransaction.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await validateBody(request, ctsUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.transactionType !== undefined) data.transactionType = body.transactionType;
  if (body.fromCountry !== undefined) data.fromCountry = body.fromCountry || null;
  if (body.toCountry !== undefined) data.toCountry = body.toCountry || null;
  if (body.currency !== undefined) data.currency = body.currency;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.exchangeRate !== undefined) data.exchangeRate = body.exchangeRate;
  if (body.jpyAmount !== undefined) data.jpyAmount = body.jpyAmount;
  if (body.transactionDate !== undefined) data.transactionDate = new Date(body.transactionDate);
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.ctsTransaction.update({ where: { id }, data });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.ctsTransaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
