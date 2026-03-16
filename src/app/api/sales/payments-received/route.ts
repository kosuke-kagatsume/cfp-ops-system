import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const payments = await prisma.paymentReceived.findMany({
    where,
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
  });

  return NextResponse.json(payments);
}
