import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
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

export async function POST(request: NextRequest) {
  const body = await request.json();

  const expenseNumber = await getNextNumber("EXP");

  const items = body.items ?? [];
  const totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);

  const record = await prisma.expense.create({
    data: {
      expenseNumber,
      applicant: body.applicant,
      department: body.department,
      expenseDate: new Date(body.expenseDate),
      totalAmount,
      status: "DRAFT",
      note: body.note,
      items: {
        create: items.map((item: { description: string; category?: string; amount: number; receiptPath?: string; note?: string }) => ({
          description: item.description,
          category: item.category || null,
          amount: item.amount,
          receiptPath: item.receiptPath || null,
          note: item.note || null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(record, { status: 201 });
}
