import { prisma } from "@/lib/db";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

type CalendarDay = {
  date: string;
  isHoliday: boolean;
  holidayName: string | null;
  note: string | null;
  calendarId: string | null;
};

type CalendarEvent = {
  id: string;
  date: string;
  category: "arrival" | "shipment" | "production";
  title: string;
  status: string;
  division: "MR" | "CR";
  sourceType: string;
  sourceId: string;
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? new Date().getFullYear().toString());
  const month = parseInt(searchParams.get("month") ?? (new Date().getMonth() + 1).toString());
  const plantId = searchParams.get("plantId");
  const category = searchParams.get("category");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Production Calendar (holidays/workdays)
  const calendarEntries = await prisma.productionCalendar.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarDays: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = calendarEntries.find(
      (e) => new Date(e.date).toISOString().split("T")[0] === dateStr
    );
    calendarDays.push({
      date: dateStr,
      isHoliday: entry?.isHoliday ?? false,
      holidayName: entry?.holidayName ?? null,
      note: entry?.note ?? null,
      calendarId: entry?.id ?? null,
    });
  }

  // Events
  const categories = category ? category.split(",") : ["arrival", "shipment", "production"];
  const events: CalendarEvent[] = [];

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
        division: (p.division as "MR" | "CR") || "MR",
        sourceType: "Purchase",
        sourceId: p.id,
      });
    }
  }

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
        division: (s.division as "MR" | "CR") || "MR",
        sourceType: "Shipment",
        sourceId: s.id,
      });
    }
  }

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
      include: { inputProduct: { select: { displayName: true } } },
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
        division: "MR",
        sourceType: "ProcessingOrder",
        sourceId: o.id,
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ calendarDays, events }, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { date, isHoliday, holidayName, note } = body;

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const record = await prisma.productionCalendar.upsert({
    where: { date: new Date(date) },
    update: {
      isWorkday: !isHoliday,
      isHoliday: isHoliday ?? false,
      holidayName: holidayName ?? null,
      note: note ?? null,
    },
    create: {
      date: new Date(date),
      isWorkday: !isHoliday,
      isHoliday: isHoliday ?? false,
      holidayName: holidayName ?? null,
      note: note ?? null,
    },
  });

  await createAuditLog({
    action: isHoliday ? "CREATE" : "UPDATE",
    tableName: "ProductionCalendar",
    recordId: record.id,
    newData: record,
  });

  return NextResponse.json(record, { status: 201 });
});
