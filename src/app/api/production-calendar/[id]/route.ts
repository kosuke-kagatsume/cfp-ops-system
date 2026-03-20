import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { productionCalendarUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.productionCalendar.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, productionCalendarUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.isWorkday !== undefined) data.isWorkday = body.isWorkday;
  if (body.isHoliday !== undefined) data.isHoliday = body.isHoliday;
  if (body.holidayName !== undefined) data.holidayName = body.holidayName || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.productionCalendar.update({ where: { id }, data });
  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "ProductionCalendar", recordId: id });
  await prisma.productionCalendar.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
