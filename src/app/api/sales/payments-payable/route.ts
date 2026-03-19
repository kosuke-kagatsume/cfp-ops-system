import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { paymentPayableCreate } from "@/lib/schemas";
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
      { paymentNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.paymentPayable.findMany({
    where,
    include: {
      supplier: { select: { id: true, code: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.paymentPayable.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: payments, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(payments, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, paymentPayableCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const paymentNumber = await getNextNumber("PAY");

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
