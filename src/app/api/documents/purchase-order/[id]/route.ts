import { prisma } from "@/lib/db";
import { generatePurchaseOrderHTML } from "@/lib/document-templates";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: {
        select: { name: true, address: true, prefecture: true, city: true },
      },
      pickupPartner: { select: { name: true } },
      product: {
        include: { name: { select: { name: true } } },
      },
      warehouse: { select: { name: true } },
    },
  });

  if (!purchase) {
    return new Response("Not found", { status: 404 });
  }

  const supplierAddress = [
    purchase.supplier.prefecture,
    purchase.supplier.city,
    purchase.supplier.address,
  ]
    .filter(Boolean)
    .join("");

  const html = generatePurchaseOrderHTML({
    purchaseNumber: purchase.purchaseNumber,
    purchaseDate: purchase.purchaseDate,
    supplierName: purchase.supplier.name,
    supplierAddress: supplierAddress || undefined,
    pickupPartnerName: purchase.pickupPartner?.name,
    productCode: purchase.product.code,
    productName: purchase.product.name?.name ?? undefined,
    quantity: purchase.quantity,
    unitPrice: purchase.unitPrice,
    amount: purchase.amount,
    freightCost: purchase.freightCost,
    packagingType: purchase.packagingType,
    warehouseName: purchase.warehouse?.name,
    status: purchase.status,
    note: purchase.note,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
