import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const division = searchParams.get("division");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { revenueNumber: { contains: search, mode: "insensitive" } },
      { product: { name: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (division) {
    where.division = division;
  }

  const revenues = await prisma.revenue.findMany({
    where,
    include: {
      product: { include: { name: true, shape: true, color: true, grade: true } },
      shipment: { select: { shipmentNumber: true, customer: { select: { name: true } } } },
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { revenueDate: "desc" },
  });

  return NextResponse.json(revenues);
}
