import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { freightCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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
      { shipment: { shipmentNumber: { contains: search, mode: "insensitive" } } },
      { carrier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [dispatches, total] = await Promise.all([
    prisma.dispatch.findMany({
    where,
    include: {
      shipment: {
        select: {
          shipmentNumber: true,
          customer: { select: { name: true } },
        },
      },
      carrier: { select: { name: true } },
    },
    orderBy: { dispatchDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.dispatch.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: dispatches, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(dispatches, { headers: cacheHeaders("TRANSACTION") });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, freightCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const dispatch = await prisma.dispatch.create({
    data: {
      shipmentId: body.shipmentId,
      carrierId: body.carrierId,
      vehicleNumber: body.vehicleNumber || null,
      driverName: body.driverName || null,
      freightCost: body.freightCost ?? null,
      dispatchDate: new Date(body.dispatchDate),
      note: body.note || null,
    },
    include: {
      shipment: {
        select: {
          shipmentNumber: true,
          customer: { select: { name: true } },
        },
      },
      carrier: { select: { name: true } },
    },
  });

  return NextResponse.json(dispatch, { status: 201 });
}
