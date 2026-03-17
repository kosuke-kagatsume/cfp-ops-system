import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const reportType = searchParams.get("reportType");

  const where: Record<string, unknown> = {};

  if (period) {
    where.period = period;
  }

  if (reportType) {
    where.reportType = reportType;
  }

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [reports, total] = await Promise.all([
    prisma.taxReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.taxReport.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: reports, total, page, limit });
  }
  return NextResponse.json(reports);
}
