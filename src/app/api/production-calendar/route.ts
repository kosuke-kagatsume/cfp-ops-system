import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};

  if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.date = { gte: start, lt: end };
  }

  const entries = await prisma.productionCalendar.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Support bulk creation for a month
  if (Array.isArray(body)) {
    const records = await prisma.$transaction(
      body.map((entry: { date: string; isWorkday?: boolean; isHoliday?: boolean; holidayName?: string; note?: string }) =>
        prisma.productionCalendar.upsert({
          where: { date: new Date(entry.date) },
          update: {
            isWorkday: entry.isWorkday ?? true,
            isHoliday: entry.isHoliday ?? false,
            holidayName: entry.holidayName,
            note: entry.note,
          },
          create: {
            date: new Date(entry.date),
            isWorkday: entry.isWorkday ?? true,
            isHoliday: entry.isHoliday ?? false,
            holidayName: entry.holidayName,
            note: entry.note,
          },
        })
      )
    );
    return NextResponse.json(records, { status: 201 });
  }

  // Single entry
  const record = await prisma.productionCalendar.upsert({
    where: { date: new Date(body.date) },
    update: {
      isWorkday: body.isWorkday ?? true,
      isHoliday: body.isHoliday ?? false,
      holidayName: body.holidayName,
      note: body.note,
    },
    create: {
      date: new Date(body.date),
      isWorkday: body.isWorkday ?? true,
      isHoliday: body.isHoliday ?? false,
      holidayName: body.holidayName,
      note: body.note,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
