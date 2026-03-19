import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

type Period = "month" | "quarter" | "year";

function getDateRange(period: Period, date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  let start: Date, end: Date, prevStart: Date, prevEnd: Date;
  let label: string;

  switch (period) {
    case "month":
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 1);
      prevStart = new Date(year, month - 1, 1);
      prevEnd = new Date(year, month, 1);
      label = `${year}年${month + 1}月`;
      break;
    case "quarter": {
      const q = Math.floor(month / 3); // 0-3
      start = new Date(year, q * 3, 1);
      end = new Date(year, q * 3 + 3, 1);
      prevStart = new Date(year, q * 3 - 3, 1);
      prevEnd = new Date(year, q * 3, 1);
      label = `${year}年 Q${q + 1}`;
      break;
    }
    case "year":
      start = new Date(year, 0, 1);
      end = new Date(year + 1, 0, 1);
      prevStart = new Date(year - 1, 0, 1);
      prevEnd = new Date(year, 0, 1);
      label = `${year}年度`;
      break;
  }

  return { start, end, prevStart, prevEnd, label };
}

function getTrendConfig(period: Period, end: Date) {
  switch (period) {
    case "month": {
      const trendStart = new Date(end.getFullYear(), end.getMonth() - 6, 1);
      return {
        trendStart,
        groupExpr: `to_char("DATE_COL", 'YYYY-MM')`,
        bucketCount: 6,
      };
    }
    case "quarter": {
      const trendStart = new Date(end.getFullYear() - 1, end.getMonth(), 1);
      return {
        trendStart,
        groupExpr: `to_char("DATE_COL", 'YYYY') || '-Q' || CEIL(EXTRACT(MONTH FROM "DATE_COL")::numeric / 3)::int`,
        bucketCount: 4,
      };
    }
    case "year": {
      const trendStart = new Date(end.getFullYear() - 3, 0, 1);
      return {
        trendStart,
        groupExpr: `to_char("DATE_COL", 'YYYY')`,
        bucketCount: 3,
      };
    }
  }
}

function generateTrendBuckets(period: Period, end: Date, count: number): string[] {
  const buckets: string[] = [];
  switch (period) {
    case "month": {
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(end.getFullYear(), end.getMonth() - 1 - i, 1);
        buckets.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      break;
    }
    case "quarter": {
      const currentQ = Math.floor((end.getMonth()) / 3); // end is exclusive, so end.getMonth() is the first month of next period
      const currentYear = end.getFullYear();
      for (let i = count - 1; i >= 0; i--) {
        let qIdx = currentQ - i;
        let y = currentYear;
        while (qIdx < 0) { qIdx += 4; y--; }
        while (qIdx > 3) { qIdx -= 4; y++; }
        buckets.push(`${y}-Q${qIdx + 1}`);
      }
      break;
    }
    case "year": {
      for (let i = count - 1; i >= 0; i--) {
        buckets.push(`${end.getFullYear() - 1 - i}`);
      }
      break;
    }
  }
  return buckets;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "month") as Period;
  const dateParam = searchParams.get("date");
  const now = dateParam ? new Date(dateParam) : new Date();

  if (!["month", "quarter", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const { start: monthStart, end: monthEnd, prevStart: prevMonthStart, prevEnd: prevMonthEnd, label: monthLabel } = getDateRange(period, now);

  const trendConfig = getTrendConfig(period, monthEnd);

  // Build raw SQL for trend based on period
  const revenueDateCol = '"revenueDate"';
  const purchaseDateCol = '"purchaseDate"';

  const revenueGroupExpr = trendConfig.groupExpr.replace(/"DATE_COL"/g, revenueDateCol);
  const costGroupExpr = trendConfig.groupExpr.replace(/"DATE_COL"/g, purchaseDateCol);

  // --- All queries in parallel ---
  const [
    currentRevenue,
    prevRevenue,
    currentCost,
    prevCost,
    pendingApprovals,
    inventoryAgg,
    tanks,
    revenueTrend,
    costTrend,
    inventoryValuation,
  ] = await Promise.all([
    // Revenue aggregation (current & previous period)
    prisma.revenue.aggregate({
      _sum: { amount: true },
      where: {
        revenueDate: { gte: monthStart, lt: monthEnd },
        salesCategory: "SALES",
      },
    }),
    prisma.revenue.aggregate({
      _sum: { amount: true },
      where: {
        revenueDate: { gte: prevMonthStart, lt: prevMonthEnd },
        salesCategory: "SALES",
      },
    }),

    // Purchase (cost) aggregation
    prisma.purchase.aggregate({
      _sum: { amount: true },
      where: { purchaseDate: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.purchase.aggregate({
      _sum: { amount: true },
      where: { purchaseDate: { gte: prevMonthStart, lt: prevMonthEnd } },
    }),

    // Pending approvals (top 10)
    prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: { createdByUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Inventory total quantity
    prisma.inventory.aggregate({ _sum: { quantity: true } }),

    // Tank utilization
    prisma.tank.findMany({
      include: { plant: { select: { name: true } } },
      orderBy: { code: "asc" },
    }),

    // Revenue trend (dynamic GROUP BY)
    prisma.$queryRawUnsafe<Array<{ bucket: string; total: number }>>(
      `SELECT ${revenueGroupExpr} as bucket,
              COALESCE(SUM(amount), 0)::float as total
       FROM "Revenue"
       WHERE "revenueDate" >= $1
         AND "revenueDate" < $2
         AND "salesCategory" = 'SALES'
         AND "deletedAt" IS NULL
       GROUP BY ${revenueGroupExpr}
       ORDER BY bucket`,
      trendConfig.trendStart,
      monthEnd
    ),

    // Cost trend (dynamic GROUP BY)
    prisma.$queryRawUnsafe<Array<{ bucket: string; total: number }>>(
      `SELECT ${costGroupExpr} as bucket,
              COALESCE(SUM(amount), 0)::float as total
       FROM "Purchase"
       WHERE "purchaseDate" >= $1
         AND "purchaseDate" < $2
         AND "deletedAt" IS NULL
       GROUP BY ${costGroupExpr}
       ORDER BY bucket`,
      trendConfig.trendStart,
      monthEnd
    ),

    // Inventory valuation via aggregate
    prisma.$queryRaw<[{ valuation: number }]>`
      SELECT COALESCE(SUM(quantity * "movingAvgCost"), 0)::float as valuation
      FROM "Inventory"
      WHERE quantity > 0
    `,
  ]);

  // Build trend from raw query results
  const revenueByBucket = new Map(revenueTrend.map((r) => [r.bucket, r.total]));
  const costByBucket = new Map(costTrend.map((r) => [r.bucket, r.total]));

  const buckets = generateTrendBuckets(period, monthEnd, trendConfig.bucketCount);
  const monthlyTrend = buckets.map((key) => {
    const revenue = revenueByBucket.get(key) ?? 0;
    const cost = costByBucket.get(key) ?? 0;
    return { month: key, revenue, cost, profit: revenue - cost };
  });

  // Build response
  const revenueTotal = currentRevenue._sum.amount ?? 0;
  const revenuePrev = prevRevenue._sum.amount ?? 0;
  const costTotal = currentCost._sum.amount ?? 0;
  const costPrev = prevCost._sum.amount ?? 0;
  const grossProfit = revenueTotal - costTotal;
  const grossProfitPrev = revenuePrev - costPrev;
  const margin = revenueTotal > 0 ? Math.round((grossProfit / revenueTotal) * 1000) / 10 : 0;

  const inventoryVal = inventoryValuation[0]?.valuation ?? 0;
  const totalKg = inventoryAgg._sum.quantity ?? 0;
  const turnover =
    costTotal > 0 && inventoryVal > 0
      ? Math.round((inventoryVal / (costTotal || 1)) * 10) / 10
      : 0;

  const tankUtilization = tanks.map((tank) => ({
    name: tank.name,
    percentage:
      tank.capacity > 0
        ? Math.round((tank.currentLevel / tank.capacity) * 100)
        : 0,
    plant: tank.plant.name,
  }));

  // Revenue target: placeholder, scaled by period
  const baseTarget = revenueTotal > 0 ? Math.round(revenueTotal * 1.2) : 15000000;
  const revenueTarget = period === "month" ? baseTarget :
    period === "quarter" ? baseTarget * 3 : baseTarget * 12;

  const data = {
    currentMonth: monthLabel,
    period,
    revenue: { total: revenueTotal, prevMonth: revenuePrev, target: revenueTarget },
    cost: { total: costTotal, prevMonth: costPrev },
    grossProfit: { total: grossProfit, prevMonth: grossProfitPrev, margin },
    inventory: { totalKg, valuationJpy: Math.round(inventoryVal), turnover },
    production: {
      mr: [] as Array<{ plant: string; produced: number; unit: string; yieldRate: number }>,
      cr: [] as Array<{
        plant: string;
        inputKg: number;
        outputOilKg: number;
        outputResidueKg: number;
        yieldRate: number;
      }>,
    },
    monthlyTrend,
    tankUtilization,
    pendingApprovals: pendingApprovals.map((a) => ({
      id: a.id,
      title: a.title,
      applicant: a.createdByUser?.name ?? "不明",
      amount: null as number | null,
      status: "承認待ち",
    })),
  };

  return NextResponse.json(data, { headers: cacheHeaders("REALTIME") });
}
