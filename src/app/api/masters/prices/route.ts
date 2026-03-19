import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { priceCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
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
    return NextResponse.json({ items: prices, total, page, limit }, { headers: cacheHeaders("MASTER") });
  }
  return NextResponse.json(prices, { headers: cacheHeaders("MASTER") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, priceCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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
