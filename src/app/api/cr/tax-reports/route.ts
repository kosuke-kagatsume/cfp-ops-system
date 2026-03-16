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

  const reports = await prisma.taxReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}
