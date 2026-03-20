import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { dispatchCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [dispatches, total] = await Promise.all([
    prisma.dispatch.findMany({
      include: {
        shipment: {
          select: {
            shipmentNumber: true,
            customer: { select: { name: true } },
            product: { include: { name: true } },
            quantity: true,
          },
        },
        carrier: { select: { id: true, code: true, name: true } },
      },
      orderBy: { dispatchDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.dispatch.count(),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: dispatches, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(dispatches, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, dispatchCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const dispatch = await prisma.dispatch.create({
    data: {
      shipmentId: body.shipmentId,
      carrierId: body.carrierId,
      vehicleNumber: body.vehicleNumber,
      driverName: body.driverName,
      freightCost: body.freightCost,
      dispatchDate: new Date(body.dispatchDate),
      note: body.note,
    },
    include: {
      shipment: { select: { shipmentNumber: true } },
      carrier: { select: { name: true } },
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "Dispatch", recordId: dispatch.id, newData: dispatch });

  return NextResponse.json(dispatch, { status: 201 });
});
