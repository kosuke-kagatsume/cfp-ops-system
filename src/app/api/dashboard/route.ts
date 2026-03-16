import { prisma } from "@/lib/db";
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

  // --- Revenue aggregation ---
  const [currentRevenue, prevRevenue] = await Promise.all([
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
  ]);

  // --- Purchase (cost) aggregation ---
  const [currentCost, prevCost] = await Promise.all([
    prisma.purchase.aggregate({
      _sum: { amount: true },
      where: {
        purchaseDate: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.purchase.aggregate({
      _sum: { amount: true },
      where: {
        purchaseDate: { gte: prevMonthStart, lt: prevMonthEnd },
      },
    }),
  ]);

  // --- Pending approvals ---
  const pendingApprovals = await prisma.approvalRequest.findMany({
    where: { status: "PENDING" },
    include: {
      createdByUser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // --- Inventory summary ---
  const inventoryAgg = await prisma.inventory.aggregate({
    _sum: { quantity: true },
  });

  // --- Tank utilization ---
  const tanks = await prisma.tank.findMany({
    include: {
      plant: { select: { name: true } },
    },
    orderBy: { code: "asc" },
  });

  // --- Monthly trend (last 6 months) ---
  const monthlyTrend: Array<{
    month: string;
    revenue: number;
    cost: number;
    profit: number;
  }> = [];

  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(currentYear, currentMonth - i, 1);
    const mEnd = new Date(currentYear, currentMonth - i + 1, 1);
    const mKey = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`;

    const [rev, cost] = await Promise.all([
      prisma.revenue.aggregate({
        _sum: { amount: true },
        where: {
          revenueDate: { gte: mStart, lt: mEnd },
          salesCategory: "SALES",
        },
      }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: {
          purchaseDate: { gte: mStart, lt: mEnd },
        },
      }),
    ]);

    const revTotal = rev._sum.amount ?? 0;
    const costTotal = cost._sum.amount ?? 0;
    monthlyTrend.push({
      month: mKey,
      revenue: revTotal,
      cost: costTotal,
      profit: revTotal - costTotal,
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

  // Inventory valuation estimate (quantity * movingAvgCost)
  const inventoryItems = await prisma.inventory.findMany({
    where: { quantity: { gt: 0 } },
    select: { quantity: true, movingAvgCost: true },
  });
  const inventoryValuation = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.movingAvgCost,
    0
  );
  const totalKg = inventoryAgg._sum.quantity ?? 0;
  const turnover =
    costTotal > 0 && inventoryValuation > 0
      ? Math.round((inventoryValuation / (costTotal || 1)) * 10) / 10
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
    inventory: { totalKg, valuationJpy: Math.round(inventoryValuation), turnover },
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
