import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const payments = await prisma.paymentPayable.findMany({
    where,
    include: {
      supplier: { select: { id: true, code: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const seq = await prisma.numberSequence.update({
    where: { prefix_year: { prefix: "PAY", year: new Date().getFullYear() } },
    data: { currentNumber: { increment: 1 } },
  });
  const paymentNumber = `PAY-${seq.year}-${String(seq.currentNumber).padStart(4, "0")}`;

  const payment = await prisma.paymentPayable.create({
    data: {
      paymentNumber,
      supplierId: body.supplierId,
      paymentDate: new Date(body.paymentDate),
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      isReconciled: false,
      note: body.note || null,
    },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
