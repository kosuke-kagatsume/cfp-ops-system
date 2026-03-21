import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

type Period = "month" | "quarter" | "year";

function getDateRange(period: Period, date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  let start: Date, end: Date;

  switch (period) {
    case "month":
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 1);
      break;
    case "quarter": {
      const q = Math.floor(month / 3);
      start = new Date(year, q * 3, 1);
      end = new Date(year, q * 3 + 3, 1);
      break;
    }
    case "year":
      start = new Date(year, 0, 1);
      end = new Date(year + 1, 0, 1);
      break;
  }

  return { start, end };
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "month") as Period;
  const dateParam = searchParams.get("date");
  const division = searchParams.get("division"); // MR or CR
  const now = dateParam ? new Date(dateParam) : new Date();

  if (!["month", "quarter", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const { start, end } = getDateRange(period, now);

  // Build parameterized queries
  const params: unknown[] = [start, end];
  let divisionFilter = "";
  if (division) {
    params.push(division);
    divisionFilter = `AND "division" = $${params.length}`;
  }

  const [revenueRows, costRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ division: string; total: number }>>(
      `SELECT "division"::text as division,
              COALESCE(SUM(amount), 0)::float as total
       FROM "Revenue"
       WHERE "revenueDate" >= $1
         AND "revenueDate" < $2
         AND "salesCategory" = 'SALES'
         AND "deletedAt" IS NULL
         ${divisionFilter}
       GROUP BY "division"
       ORDER BY "division"`,
      ...params
    ),

    prisma.$queryRawUnsafe<Array<{ division: string; total: number }>>(
      `SELECT "division"::text as division,
              COALESCE(SUM(amount), 0)::float as total
       FROM "Purchase"
       WHERE "purchaseDate" >= $1
         AND "purchaseDate" < $2
         AND "deletedAt" IS NULL
         ${divisionFilter}
       GROUP BY "division"
       ORDER BY "division"`,
      ...params
    ),
  ]);

  // Build P/L table by division
  const plMap = new Map<string, { division: string; revenue: number; cost: number; grossProfit: number; margin: number }>();

  for (const row of revenueRows) {
    const key = row.division;
    if (!plMap.has(key)) {
      plMap.set(key, { division: row.division, revenue: 0, cost: 0, grossProfit: 0, margin: 0 });
    }
    plMap.get(key)!.revenue += row.total;
  }

  for (const row of costRows) {
    const key = row.division;
    if (!plMap.has(key)) {
      plMap.set(key, { division: row.division, revenue: 0, cost: 0, grossProfit: 0, margin: 0 });
    }
    plMap.get(key)!.cost += row.total;
  }

  const items = Array.from(plMap.values()).map((item) => ({
    ...item,
    grossProfit: item.revenue - item.cost,
    margin: item.revenue > 0 ? Math.round(((item.revenue - item.cost) / item.revenue) * 1000) / 10 : 0,
  }));

  const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0);
  const totalCost = items.reduce((sum, i) => sum + i.cost, 0);

  return NextResponse.json({
    period,
    start: start.toISOString(),
    end: end.toISOString(),
    items,
    summary: {
      revenue: totalRevenue,
      cost: totalCost,
      grossProfit: totalRevenue - totalCost,
      margin: totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10 : 0,
    },
  }, { headers: cacheHeaders("REALTIME") });
});
