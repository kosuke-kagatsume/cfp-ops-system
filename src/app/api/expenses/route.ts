import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { generateExpenseJournal } from "@/lib/journal";
import { createApprovalFlow } from "@/lib/approval";
import { validateBody } from "@/lib/validate";
import { expenseCreate } from "@/lib/schemas";
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

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
    where,
    include: {
      items: true,
    },
    orderBy: { expenseDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: expenses, total, page, limit });
  }
  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, expenseCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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

  // 承認フロー作成（ユーザーが存在する場合）
  try {
    await createApprovalFlow({
      category: "EXPENSE",
      targetType: "Expense",
      targetId: record.id,
      requesterId: body.createdBy ?? "system",
      title: `経費申請 ${expenseNumber}`,
      description: `${body.applicant}: ¥${totalAmount.toLocaleString()}`,
      amount: totalAmount,
    });
  } catch {
    // 承認フロー作成失敗（ユーザー未登録時など）は無視
  }

  // 仕訳自動生成
  await generateExpenseJournal({
    id: record.id,
    expenseNumber: record.expenseNumber,
    expenseDate: record.expenseDate,
    totalAmount: record.totalAmount,
    items: record.items.map((item) => ({
      category: item.category,
      amount: item.amount,
      description: item.description,
    })),
  });

  return NextResponse.json(record, { status: 201 });
}
