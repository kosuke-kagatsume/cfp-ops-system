import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const fiscalYear = parseInt(searchParams.get("fiscalYear") ?? new Date().getFullYear().toString());
  const department = searchParams.get("department");

  const where: Record<string, unknown> = { fiscalYear };
  if (department) where.department = department;

  const budgets = await prisma.budget.findMany({
    where,
    orderBy: [{ month: "asc" }, { department: "asc" }, { category: "asc" }],
  });

  return NextResponse.json(budgets, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  // Support single or bulk upsert
  const items = Array.isArray(body) ? body : [body];

  const results = [];
  for (const item of items) {
    const record = await prisma.budget.upsert({
      where: {
        fiscalYear_month_department_plantId_category: {
          fiscalYear: item.fiscalYear,
          month: item.month,
          department: item.department,
          plantId: item.plantId ?? null,
          category: item.category,
        },
      },
      update: { amount: item.amount, note: item.note ?? null },
      create: {
        fiscalYear: item.fiscalYear,
        month: item.month,
        department: item.department,
        plantId: item.plantId ?? null,
        category: item.category,
        amount: item.amount,
        note: item.note ?? null,
      },
    });
    results.push(record);
  }

  await createAuditLog({ action: "CREATE", tableName: "Budget", recordId: "bulk", newData: { count: results.length } });

  return NextResponse.json(results, { status: 201 });
});
