import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { expenseUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.expense.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, expenseUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  // Handle nested items: delete existing + recreate
  const { items, ...rest } = body;

  const data: Record<string, unknown> = {};
  if (rest.applicant !== undefined) data.applicant = rest.applicant;
  if (rest.department !== undefined) data.department = rest.department || null;
  if (rest.expenseDate !== undefined) data.expenseDate = new Date(rest.expenseDate);
  if (rest.totalAmount !== undefined) data.totalAmount = rest.totalAmount;
  if (rest.status !== undefined) data.status = rest.status;
  if (rest.note !== undefined) data.note = rest.note || null;

  if (items && Array.isArray(items)) {
    // Delete existing items and recreate
    await prisma.expenseItem.deleteMany({ where: { expenseId: id } });
    data.items = {
      create: items.map((item: { description: string; category?: string; amount: number; receiptPath?: string; note?: string }) => ({
        description: item.description,
        category: item.category || null,
        amount: item.amount,
        receiptPath: item.receiptPath || null,
        note: item.note || null,
      })),
    };
    // Recalculate total
    data.totalAmount = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
  }

  const record = await prisma.expense.update({
    where: { id },
    data,
    include: { items: true },
  });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // Delete items first, then expense
  await createAuditLog({ action: "DELETE", tableName: "Expense", recordId: id });
  await prisma.expenseItem.deleteMany({ where: { expenseId: id } });
  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
