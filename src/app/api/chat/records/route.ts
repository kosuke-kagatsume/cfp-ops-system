import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

type RecordResult = {
  targetType: string;
  targetId: string;
  label: string;
  number: string;
};

// GET: 伝票検索（チャットから伝票トークを開始するため）
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType");
  const search = searchParams.get("search") || "";

  if (!targetType) {
    return NextResponse.json({ error: "targetType is required" }, { status: 400 });
  }

  const limit = 20;
  const results: RecordResult[] = [];

  switch (targetType) {
    case "Deal": {
      const items = await prisma.deal.findMany({
        where: search
          ? {
              OR: [
                { dealNumber: { contains: search, mode: "insensitive" as const } },
                { title: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        select: { id: true, dealNumber: true, title: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({ targetType: "Deal", targetId: i.id, label: i.title, number: i.dealNumber })
      );
      break;
    }
    case "Purchase": {
      const items = await prisma.purchase.findMany({
        where: search
          ? { purchaseNumber: { contains: search, mode: "insensitive" as const } }
          : {},
        select: { id: true, purchaseNumber: true, supplier: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({
          targetType: "Purchase",
          targetId: i.id,
          label: i.supplier?.name ?? "仕入",
          number: i.purchaseNumber,
        })
      );
      break;
    }
    case "Shipment": {
      const items = await prisma.shipment.findMany({
        where: search
          ? { shipmentNumber: { contains: search, mode: "insensitive" as const } }
          : {},
        select: { id: true, shipmentNumber: true, customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({
          targetType: "Shipment",
          targetId: i.id,
          label: i.customer?.name ?? "出荷",
          number: i.shipmentNumber,
        })
      );
      break;
    }
    case "SalesOrder": {
      const items = await prisma.salesOrder.findMany({
        where: search
          ? { orderNumber: { contains: search, mode: "insensitive" as const } }
          : {},
        select: { id: true, orderNumber: true, customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({
          targetType: "SalesOrder",
          targetId: i.id,
          label: i.customer?.name ?? "受注",
          number: i.orderNumber,
        })
      );
      break;
    }
    case "Invoice": {
      const items = await prisma.invoice.findMany({
        where: search
          ? { invoiceNumber: { contains: search, mode: "insensitive" as const } }
          : {},
        select: { id: true, invoiceNumber: true, customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({
          targetType: "Invoice",
          targetId: i.id,
          label: i.customer?.name ?? "請求",
          number: i.invoiceNumber,
        })
      );
      break;
    }
    case "Quotation": {
      const items = await prisma.quotation.findMany({
        where: search
          ? { quotationNumber: { contains: search, mode: "insensitive" as const } }
          : {},
        select: { id: true, quotationNumber: true, customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({
          targetType: "Quotation",
          targetId: i.id,
          label: i.customer?.name ?? "見積",
          number: i.quotationNumber,
        })
      );
      break;
    }
    case "Contract": {
      const items = await prisma.contract.findMany({
        where: search
          ? {
              OR: [
                { contractNumber: { contains: search, mode: "insensitive" as const } },
                { title: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        select: { id: true, contractNumber: true, title: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({ targetType: "Contract", targetId: i.id, label: i.title, number: i.contractNumber })
      );
      break;
    }
    case "ProcessingOrder": {
      const items = await prisma.processingOrder.findMany({
        where: search
          ? { orderNumber: { contains: search, mode: "insensitive" as const } }
          : {},
        select: { id: true, orderNumber: true, inputProduct: { select: { displayName: true, name: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({
          targetType: "ProcessingOrder",
          targetId: i.id,
          label: i.inputProduct?.displayName ?? i.inputProduct?.name?.name ?? "加工",
          number: i.orderNumber,
        })
      );
      break;
    }
    case "Expense": {
      const items = await prisma.expense.findMany({
        where: search
          ? { expenseNumber: { contains: search, mode: "insensitive" as const } }
          : {},
        select: { id: true, expenseNumber: true, applicant: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      items.forEach((i) =>
        results.push({
          targetType: "Expense",
          targetId: i.id,
          label: i.applicant ?? "経費",
          number: i.expenseNumber,
        })
      );
      break;
    }
  }

  return NextResponse.json(results, { headers: cacheHeaders("TRANSACTION") });
});
