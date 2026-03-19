import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { partner: { name: { contains: search, mode: "insensitive" } } },
      { product: { code: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [prices, total] = await Promise.all([
    prisma.customerPrice.findMany({
    where,
    include: {
      partner: { select: { id: true, code: true, name: true } },
      product: {
        include: { name: true, shape: true, color: true, grade: true },
      },
    },
    orderBy: { validFrom: "desc" },
      skip,
      take: limit,
    }),
    prisma.customerPrice.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: prices, total, page, limit }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  }
  return NextResponse.json(prices, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const price = await prisma.customerPrice.create({
    data: {
      partnerId: body.partnerId,
      productId: body.productId,
      unitPrice: body.unitPrice,
      currency: body.currency ?? "JPY",
      validFrom: new Date(body.validFrom),
      validTo: body.validTo ? new Date(body.validTo) : null,
      note: body.note,
    },
    include: {
      partner: { select: { id: true, code: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
    },
  });

  return NextResponse.json(price, { status: 201 });
}
