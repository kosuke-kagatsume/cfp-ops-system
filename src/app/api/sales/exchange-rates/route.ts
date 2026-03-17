import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: { effectiveDate: "desc" },
  });

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
