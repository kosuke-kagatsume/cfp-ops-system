import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

type CalendarEvent = {
  id: string;
  date: string;
  category: "arrival" | "shipment" | "production";
  title: string;
  status: string;
  sourceType: string;
  sourceId: string;
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? new Date().getFullYear().toString());
  const month = parseInt(searchParams.get("month") ?? (new Date().getMonth() + 1).toString());
  const plantId = searchParams.get("plantId");
  const category = searchParams.get("category"); // arrival|shipment|production (comma-separated)

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const categories = category ? category.split(",") : ["arrival", "shipment", "production"];
  const events: CalendarEvent[] = [];

  // 入荷 (Purchase)
  if (categories.includes("arrival")) {
    const purchaseWhere: Record<string, unknown> = {
      OR: [
        { arrivalDate: { gte: startDate, lte: endDate } },
        { arrivalDate: null, purchaseDate: { gte: startDate, lte: endDate } },
      ],
    };
    if (plantId) purchaseWhere.warehouseId = plantId;

    const purchases = await prisma.purchase.findMany({
      where: purchaseWhere,
      include: {
        supplier: { select: { name: true } },
        product: { select: { displayName: true } },
      },
    });

    for (const p of purchases) {
      const date = p.arrivalDate ?? p.purchaseDate;
      events.push({
        id: p.id,
        date: new Date(date).toISOString().split("T")[0],
        category: "arrival",
        title: `${p.supplier?.name ?? "?"} ${p.product?.displayName ?? ""} ${p.quantity ?? ""}kg`,
        status: p.status,
        sourceType: "Purchase",
        sourceId: p.id,
      });
    }
  }

  // 出荷 (Shipment)
  if (categories.includes("shipment")) {
    const shipmentWhere: Record<string, unknown> = {
      shipmentDate: { gte: startDate, lte: endDate },
    };
    if (plantId) shipmentWhere.warehouseId = plantId;

    const shipments = await prisma.shipment.findMany({
      where: shipmentWhere,
      include: {
        customer: { select: { name: true } },
        product: { select: { displayName: true } },
      },
    });

    for (const s of shipments) {
      events.push({
        id: s.id,
        date: s.shipmentDate ? new Date(s.shipmentDate).toISOString().split("T")[0] : "",
        category: "shipment",
        title: `${s.customer?.name ?? "?"} ${s.product?.displayName ?? ""} ${s.quantity ?? ""}kg`,
        status: s.status,
        sourceType: "Shipment",
        sourceId: s.id,
      });
    }
  }

  // 生産 (ProcessingOrder)
  if (categories.includes("production")) {
    const procWhere: Record<string, unknown> = {
      OR: [
        { orderDate: { gte: startDate, lte: endDate } },
        { completedDate: { gte: startDate, lte: endDate } },
      ],
    };
    if (plantId) procWhere.plantId = plantId;

    const orders = await prisma.processingOrder.findMany({
      where: procWhere,
      include: {
        inputProduct: { select: { displayName: true } },
      },
    });

    for (const o of orders) {
      const date = o.orderDate ?? o.completedDate;
      if (!date) continue;
      events.push({
        id: o.id,
        date: new Date(date).toISOString().split("T")[0],
        category: "production",
        title: `${o.inputProduct?.displayName ?? ""} ${o.inputQuantity ?? ""}kg ${o.status}`,
        status: o.status,
        sourceType: "ProcessingOrder",
        sourceId: o.id,
      });
    }
  }

  // 日付順ソート
  events.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ events }, { headers: cacheHeaders("TRANSACTION") });
});
