import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { shipment: { shipmentNumber: { contains: search, mode: "insensitive" } } },
      { carrier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const dispatches = await prisma.dispatch.findMany({
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
  });

  return NextResponse.json(dispatches);
}
