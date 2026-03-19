import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { validateBody } from "@/lib/validate";
import { shipmentCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { shipmentNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { product: { name: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
    where,
    include: {
      customer: { select: { id: true, code: true, name: true } },
      deliveryPartner: { select: { id: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true } },
      dispatch: { select: { id: true, carrierId: true, carrier: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: shipments, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(shipments, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, shipmentCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const shipmentNumber = await getNextNumber("SHP");

  const shipment = await prisma.shipment.create({
    data: {
      shipmentNumber,
      customerId: body.customerId,
      deliveryPartnerId: body.deliveryPartnerId,
      productId: body.productId,
      packagingType: body.packagingType,
      warehouseId: body.warehouseId,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      amount: body.unitPrice ? body.quantity * body.unitPrice : null,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      shipmentDate: body.shipmentDate ? new Date(body.shipmentDate) : null,
      status: "SHIPPING_LIST",
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
    },
  });

  return NextResponse.json(shipment, { status: 201 });
}
