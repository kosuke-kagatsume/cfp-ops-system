import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { fromCountry: { contains: search, mode: "insensitive" } },
      { toCountry: { contains: search, mode: "insensitive" } },
      { note: { contains: search, mode: "insensitive" } },
    ];
  }

  if (type) {
    where.transactionType = type;
  }

  const transactions = await prisma.ctsTransaction.findMany({
    where,
    orderBy: { transactionDate: "desc" },
  });

  return NextResponse.json(transactions);
}
