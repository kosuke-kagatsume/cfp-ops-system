import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { exchangeRateCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [rates, total] = await Promise.all([
    prisma.exchangeRate.findMany({

    orderBy: { effectiveDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.exchangeRate.count(),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: rates, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(rates, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, exchangeRateCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const rate = await prisma.exchangeRate.create({
    data: {
      fromCurrency: body.fromCurrency,
      toCurrency: body.toCurrency,
      rate: body.rate,
      effectiveDate: new Date(body.effectiveDate),
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "ExchangeRate", recordId: rate.id, newData: rate });

  return NextResponse.json(rate, { status: 201 });
});
