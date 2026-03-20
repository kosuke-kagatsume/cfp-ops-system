import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "";

  const where: Record<string, unknown> = {};
  if (period) {
    where.period = period;
  }

  const data = await prisma.massBalance.findMany({
    where,
    include: {
      certificate: { select: { id: true, certNumber: true, holderName: true } },
      product: { select: { id: true, code: true }, include: { name: true } },
    },
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(data);
});
