import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { exchangeRateUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.exchangeRate.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, exchangeRateUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const data: Record<string, unknown> = {};
  if (body.fromCurrency !== undefined) data.fromCurrency = body.fromCurrency;
  if (body.toCurrency !== undefined) data.toCurrency = body.toCurrency;
  if (body.rate !== undefined) data.rate = body.rate;
  if (body.effectiveDate !== undefined) data.effectiveDate = new Date(body.effectiveDate);

  const record = await prisma.exchangeRate.update({ where: { id }, data });
  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "ExchangeRate", recordId: id });
  await prisma.exchangeRate.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
