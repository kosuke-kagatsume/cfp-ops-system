import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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
    return NextResponse.json({ items: rates, total, page, limit });
  }
  return NextResponse.json(rates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const rate = await prisma.exchangeRate.create({
    data: {
      fromCurrency: body.fromCurrency,
      toCurrency: body.toCurrency,
      rate: body.rate,
      effectiveDate: new Date(body.effectiveDate),
    },
  });

  return NextResponse.json(rate, { status: 201 });
}
