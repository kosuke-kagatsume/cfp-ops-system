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
