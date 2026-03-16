import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { purchaseNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
      { product: { name: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      pickupPartner: { select: { id: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });

  return NextResponse.json(purchases);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 採番
  const seq = await prisma.numberSequence.update({
    where: { prefix_year: { prefix: "PUR", year: new Date().getFullYear() } },
    data: { currentNumber: { increment: 1 } },
  });
  const purchaseNumber = `PUR-${seq.year}-${String(seq.currentNumber).padStart(4, "0")}`;

  const purchase = await prisma.purchase.create({
    data: {
      purchaseNumber,
      supplierId: body.supplierId,
      pickupPartnerId: body.pickupPartnerId,
      productId: body.productId,
      packagingType: body.packagingType,
      warehouseId: body.warehouseId,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      amount: body.quantity * body.unitPrice,
      freightCost: body.freightCost,
      purchaseDate: new Date(body.purchaseDate),
      status: "PLANNED",
    },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
    },
  });

  return NextResponse.json(purchase, { status: 201 });
}
