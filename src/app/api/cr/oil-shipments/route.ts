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
      { shipmentNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const shipments = await prisma.oilShipment.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { shipmentDate: "desc" },
  });

  return NextResponse.json(shipments);
}
