import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const fiscalYear = parseInt(searchParams.get("fiscalYear") ?? new Date().getFullYear().toString());
  const department = searchParams.get("department");

  // Get budgets
  const budgetWhere: Record<string, unknown> = { fiscalYear };
  if (department) budgetWhere.department = department;

  const budgets = await prisma.budget.findMany({ where: budgetWhere });

  // Get actuals: revenue and cost by month
  const yearStart = new Date(fiscalYear, 0, 1);
  const yearEnd = new Date(fiscalYear + 1, 0, 1);

  const [revenueByMonth, costByMonth] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ month: number; total: number }>>(
      `SELECT EXTRACT(MONTH FROM "revenueDate")::int as month,
              COALESCE(SUM(amount), 0)::float as total
       FROM "Revenue"
       WHERE "revenueDate" >= $1 AND "revenueDate" < $2
         AND "salesCategory" = 'SALES'
         AND "deletedAt" IS NULL
       GROUP BY EXTRACT(MONTH FROM "revenueDate")
       ORDER BY month`,
      yearStart,
      yearEnd
    ),
    prisma.$queryRawUnsafe<Array<{ month: number; total: number }>>(
      `SELECT EXTRACT(MONTH FROM "purchaseDate")::int as month,
              COALESCE(SUM(amount), 0)::float as total
       FROM "Purchase"
       WHERE "purchaseDate" >= $1 AND "purchaseDate" < $2
         AND "deletedAt" IS NULL
       GROUP BY EXTRACT(MONTH FROM "purchaseDate")
       ORDER BY month`,
      yearStart,
      yearEnd
    ),
  ]);

  const revenueMap = new Map(revenueByMonth.map((r) => [r.month, r.total]));
  const costMap = new Map(costByMonth.map((r) => [r.month, r.total]));

  // Build variance report by month
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const budgetRevenue = budgets
      .filter((b) => b.month === m && b.category === "REVENUE")
      .reduce((sum, b) => sum + b.amount, 0);
    const budgetCost = budgets
      .filter((b) => b.month === m && b.category === "COST")
      .reduce((sum, b) => sum + b.amount, 0);

    const actualRevenue = revenueMap.get(m) ?? 0;
    const actualCost = costMap.get(m) ?? 0;

    months.push({
      month: m,
      budget: { revenue: budgetRevenue, cost: budgetCost, profit: budgetRevenue - budgetCost },
      actual: { revenue: actualRevenue, cost: actualCost, profit: actualRevenue - actualCost },
      variance: {
        revenue: actualRevenue - budgetRevenue,
        cost: actualCost - budgetCost,
        profit: (actualRevenue - actualCost) - (budgetRevenue - budgetCost),
      },
    });
  }

  return NextResponse.json({ fiscalYear, months }, { headers: cacheHeaders("REALTIME") });
});
