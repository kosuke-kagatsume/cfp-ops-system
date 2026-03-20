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
  const plantId = searchParams.get("plantId");
  const now = dateParam ? new Date(dateParam) : new Date();

  if (!["month", "quarter", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const { start, end } = getDateRange(period, now);

  // Build WHERE conditions for raw queries
  const divisionFilter = division ? `AND "division" = '${division}'` : "";
  const plantFilter = plantId ? `AND "plantId" = '${plantId}'` : "";

  const [revenueRows, costRows] = await Promise.all([
    // Revenue by division/plant
    prisma.$queryRawUnsafe<Array<{ division: string; plant_id: string | null; plant_name: string | null; total: number }>>(
      `SELECT r."division"::text as division,
              r."plantId" as plant_id,
              p."name" as plant_name,
              COALESCE(SUM(r.amount), 0)::float as total
       FROM "Revenue" r
       LEFT JOIN "Plant" p ON p.id = r."plantId"
       WHERE r."revenueDate" >= $1
         AND r."revenueDate" < $2
         AND r."salesCategory" = 'SALES'
         AND r."deletedAt" IS NULL
         ${divisionFilter}
         ${plantFilter}
       GROUP BY r."division", r."plantId", p."name"
       ORDER BY r."division", p."name"`,
      start,
      end
    ),

    // Cost (purchases) by division/plant
    prisma.$queryRawUnsafe<Array<{ division: string; plant_id: string | null; plant_name: string | null; total: number }>>(
      `SELECT pu."division"::text as division,
              pu."plantId" as plant_id,
              p."name" as plant_name,
              COALESCE(SUM(pu.amount), 0)::float as total
       FROM "Purchase" pu
       LEFT JOIN "Plant" p ON p.id = pu."plantId"
       WHERE pu."purchaseDate" >= $1
         AND pu."purchaseDate" < $2
         AND pu."deletedAt" IS NULL
         ${divisionFilter}
         ${plantFilter}
       GROUP BY pu."division", pu."plantId", p."name"
       ORDER BY pu."division", p."name"`,
      start,
      end
    ),
  ]);

  // Build P/L table
  const plMap = new Map<string, { division: string; plantId: string | null; plantName: string; revenue: number; cost: number; grossProfit: number; margin: number }>();

  for (const row of revenueRows) {
    const key = `${row.division}-${row.plant_id ?? "all"}`;
    if (!plMap.has(key)) {
      plMap.set(key, {
        division: row.division,
        plantId: row.plant_id,
        plantName: row.plant_name ?? "全体",
        revenue: 0,
        cost: 0,
        grossProfit: 0,
        margin: 0,
      });
    }
    plMap.get(key)!.revenue += row.total;
  }

  for (const row of costRows) {
    const key = `${row.division}-${row.plant_id ?? "all"}`;
    if (!plMap.has(key)) {
      plMap.set(key, {
        division: row.division,
        plantId: row.plant_id,
        plantName: row.plant_name ?? "全体",
        revenue: 0,
        cost: 0,
        grossProfit: 0,
        margin: 0,
      });
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
