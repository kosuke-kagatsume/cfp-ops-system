import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.productionCalendar.findUnique({ where: { id } });
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
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.isWorkday !== undefined) data.isWorkday = body.isWorkday;
  if (body.isHoliday !== undefined) data.isHoliday = body.isHoliday;
  if (body.holidayName !== undefined) data.holidayName = body.holidayName || null;
  if (body.note !== undefined) data.note = body.note || null;

  const record = await prisma.productionCalendar.update({ where: { id }, data });
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.productionCalendar.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
