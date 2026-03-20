import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async () => {
  const now = new Date();

  // Get unpaid invoices with due dates
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { not: "PAID" },
      dueDate: { not: null },
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });

  // Bucket: 当月 / 1-30日 / 31-60日 / 61-90日 / 90日超
  type Bucket = { current: number; days1_30: number; days31_60: number; days61_90: number; over90: number; total: number };
  const customerMap = new Map<string, { customerId: string; customerName: string } & Bucket>();

  const totals: Bucket = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0 };

  for (const inv of invoices) {
    if (!inv.dueDate) continue;

    const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = inv.total;

    const key = inv.customerId;
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        customerId: inv.customerId,
        customerName: inv.customer?.name ?? "-",
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        over90: 0,
        total: 0,
      });
    }

    const entry = customerMap.get(key)!;

    if (daysOverdue <= 0) {
      entry.current += amount;
      totals.current += amount;
    } else if (daysOverdue <= 30) {
      entry.days1_30 += amount;
      totals.days1_30 += amount;
    } else if (daysOverdue <= 60) {
      entry.days31_60 += amount;
      totals.days31_60 += amount;
    } else if (daysOverdue <= 90) {
      entry.days61_90 += amount;
      totals.days61_90 += amount;
    } else {
      entry.over90 += amount;
      totals.over90 += amount;
    }

    entry.total += amount;
    totals.total += amount;
  }

  const items = Array.from(customerMap.values()).sort((a, b) => b.total - a.total);

  return NextResponse.json({ items, totals }, { headers: cacheHeaders("REALTIME") });
});
