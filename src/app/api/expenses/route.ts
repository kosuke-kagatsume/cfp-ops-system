import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { expenseNumber: { contains: search, mode: "insensitive" } },
      { applicant: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: { expenseDate: "desc" },
  });

  return NextResponse.json(expenses);
}
