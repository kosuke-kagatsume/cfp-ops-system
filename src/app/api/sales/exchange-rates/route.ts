import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: { effectiveDate: "desc" },
  });

  return NextResponse.json(rates);
}
