import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { updateMovingAverage } from "@/lib/inventory";
import { generatePurchaseJournal } from "@/lib/journal";
import { validateBody } from "@/lib/validate";
import { purchaseCreate } from "@/lib/schemas";
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
      { purchaseNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
      { product: { name: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
    where,
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      pickupPartner: { select: { id: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
    orderBy: { purchaseDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: purchases, total, page, limit }, { headers: { "Cache-Control": "private, no-cache" } });
  }
  return NextResponse.json(purchases, { headers: { "Cache-Control": "private, no-cache" } });
}

export async function POST(request: NextRequest) {
  const result = await validateBody(request, purchaseCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  // 採番
  const purchaseNumber = await getNextNumber("PUR");

  const initialStatus = body.status ?? "PLANNED";

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
      status: initialStatus,
    },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
    },
  });

  // Update inventory when purchase is received or confirmed
  if (
    (initialStatus === "RECEIVED" || initialStatus === "CONFIRMED") &&
    body.warehouseId &&
    body.productId
  ) {
    await updateMovingAverage({
      productId: body.productId,
      warehouseId: body.warehouseId,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      purchaseId: purchase.id,
    });
  }

  // 仕訳自動生成
  await generatePurchaseJournal({
    id: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    purchaseDate: purchase.purchaseDate,
    amount: purchase.amount,
    freightCost: purchase.freightCost,
  });

  return NextResponse.json(purchase, { status: 201 });
}
