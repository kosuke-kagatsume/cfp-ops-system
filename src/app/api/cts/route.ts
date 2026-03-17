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

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [transactions, total] = await Promise.all([
    prisma.ctsTransaction.findMany({
    where,
    orderBy: { transactionDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.ctsTransaction.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: transactions, total, page, limit });
  }
  return NextResponse.json(transactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const record = await prisma.ctsTransaction.create({
    data: {
      transactionType: body.transactionType,
      fromCountry: body.fromCountry,
      toCountry: body.toCountry,
      currency: body.currency ?? "USD",
      amount: body.amount,
      exchangeRate: body.exchangeRate,
      jpyAmount: body.jpyAmount,
      transactionDate: new Date(body.transactionDate),
      note: body.note,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
