import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.exchangeRate.findUnique({ where: { id } });
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
  if (body.fromCurrency !== undefined) data.fromCurrency = body.fromCurrency;
  if (body.toCurrency !== undefined) data.toCurrency = body.toCurrency;
  if (body.rate !== undefined) data.rate = body.rate;
  if (body.effectiveDate !== undefined) data.effectiveDate = new Date(body.effectiveDate);

  const record = await prisma.exchangeRate.update({ where: { id }, data });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.exchangeRate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
