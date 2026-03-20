import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async () => {
  const now = new Date();

  // Get unreconciled payables
  const payables = await prisma.paymentPayable.findMany({
    where: {
      isReconciled: false,
    },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
    },
  });

  type Bucket = { current: number; days1_30: number; days31_60: number; days61_90: number; over90: number; total: number };
  const supplierMap = new Map<string, { supplierId: string; supplierName: string } & Bucket>();

  const totals: Bucket = { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0 };

  for (const pay of payables) {
    const daysAge = Math.floor((now.getTime() - pay.paymentDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = pay.amount;

    const key = pay.supplierId;
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        supplierId: pay.supplierId,
        supplierName: pay.supplier?.name ?? "-",
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        over90: 0,
        total: 0,
      });
    }

    const entry = supplierMap.get(key)!;

    if (daysAge <= 0) {
      entry.current += amount;
      totals.current += amount;
    } else if (daysAge <= 30) {
      entry.days1_30 += amount;
      totals.days1_30 += amount;
    } else if (daysAge <= 60) {
      entry.days31_60 += amount;
      totals.days31_60 += amount;
    } else if (daysAge <= 90) {
      entry.days61_90 += amount;
      totals.days61_90 += amount;
    } else {
      entry.over90 += amount;
      totals.over90 += amount;
    }

    entry.total += amount;
    totals.total += amount;
  }

  const items = Array.from(supplierMap.values()).sort((a, b) => b.total - a.total);

  return NextResponse.json({ items, totals }, { headers: cacheHeaders("REALTIME") });
});
