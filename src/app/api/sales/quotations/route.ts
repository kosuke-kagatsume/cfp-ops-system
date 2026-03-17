import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { name: true } },
    },
    orderBy: { quotationDate: "desc" },
  });

  return NextResponse.json(quotations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const quotationNumber = await getNextNumber("QUO");

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      customerId: body.customerId,
      quotationDate: new Date(body.quotationDate),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      subject: body.subject || null,
      items: body.items ?? [],
      subtotal: body.subtotal ?? 0,
      taxAmount: body.taxAmount ?? 0,
      total: body.total ?? 0,
      currency: body.currency ?? "JPY",
      status: "DRAFT",
      note: body.note || null,
    },
    include: {
      customer: { select: { name: true } },
    },
  });

  return NextResponse.json(quotation, { status: 201 });
}
