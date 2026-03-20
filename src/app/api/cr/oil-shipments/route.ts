import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { oilShipmentCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { shipmentNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [shipments, total] = await Promise.all([
    prisma.oilShipment.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { shipmentDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.oilShipment.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: shipments, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(shipments, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, oilShipmentCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const shipmentNumber = await getNextNumber("OIL");

  const record = await prisma.oilShipment.create({
    data: {
      shipmentNumber,
      customerId: body.customerId,
      oilType: body.oilType,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      amount: body.amount ?? (body.quantity && body.unitPrice ? body.quantity * body.unitPrice : undefined),
      shipmentDate: new Date(body.shipmentDate),
      note: body.note,
    },
    include: {
      customer: { select: { id: true, name: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "OilShipment", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
