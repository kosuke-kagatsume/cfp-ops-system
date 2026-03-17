import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Current month range
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 1);

  // Previous month range
  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthEnd = new Date(currentYear, currentMonth, 1);

  // 6-month range for trend query
  const trendStart = new Date(currentYear, currentMonth - 5, 1);

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
    // Revenue aggregation (current & previous month)
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

    // Monthly revenue trend (single query with GROUP BY)
    prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT to_char("revenueDate", 'YYYY-MM') as month,
             COALESCE(SUM(amount), 0)::float as total
      FROM "Revenue"
      WHERE "revenueDate" >= ${trendStart}
        AND "revenueDate" < ${monthEnd}
        AND "salesCategory" = 'SALES'
        AND "deletedAt" IS NULL
      GROUP BY to_char("revenueDate", 'YYYY-MM')
      ORDER BY month
    `,

    // Monthly cost trend (single query with GROUP BY)
    prisma.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT to_char("purchaseDate", 'YYYY-MM') as month,
             COALESCE(SUM(amount), 0)::float as total
      FROM "Purchase"
      WHERE "purchaseDate" >= ${trendStart}
        AND "purchaseDate" < ${monthEnd}
        AND "deletedAt" IS NULL
      GROUP BY to_char("purchaseDate", 'YYYY-MM')
      ORDER BY month
    `,

    // Inventory valuation via aggregate (avoid fetching all rows)
    prisma.$queryRaw<[{ valuation: number }]>`
      SELECT COALESCE(SUM(quantity * "movingAvgCost"), 0)::float as valuation
      FROM "Inventory"
      WHERE quantity > 0
    `,
  ]);

  // Build monthly trend from raw query results
  const revenueByMonth = new Map(revenueTrend.map((r) => [r.month, r.total]));
  const costByMonth = new Map(costTrend.map((r) => [r.month, r.total]));

  const monthlyTrend: Array<{
    month: string;
    revenue: number;
    cost: number;
    profit: number;
  }> = [];

  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(currentYear, currentMonth - i, 1);
    const mKey = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`;
    const revenue = revenueByMonth.get(mKey) ?? 0;
    const cost = costByMonth.get(mKey) ?? 0;
    monthlyTrend.push({
      month: mKey,
      revenue,
      cost,
      profit: revenue - cost,
    });
  }

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

  // Revenue target: placeholder (could come from SystemSetting)
  const revenueTarget = revenueTotal > 0 ? Math.round(revenueTotal * 1.2) : 15000000;

  const monthLabel = `${currentYear}年${currentMonth + 1}月`;

  const data = {
    currentMonth: monthLabel,
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

  return NextResponse.json(data);
}
