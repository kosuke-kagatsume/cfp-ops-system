import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { partner: { name: { contains: search, mode: "insensitive" } } },
      { product: { code: { contains: search, mode: "insensitive" } } },
    ];
  }

  const prices = await prisma.customerPrice.findMany({
    where,
    include: {
      partner: { select: { id: true, code: true, name: true } },
      product: {
        select: { id: true, code: true },
        include: { name: true, shape: true, color: true, grade: true },
      },
    },
    orderBy: { validFrom: "desc" },
  });

  return NextResponse.json(prices);
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
