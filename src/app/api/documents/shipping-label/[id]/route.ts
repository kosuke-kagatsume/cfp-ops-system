import { prisma } from "@/lib/db";
import { generateShippingLabelHTML } from "@/lib/document-templates";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      customer: {
        select: { name: true, address: true, prefecture: true, city: true },
      },
      product: {
        include: { name: { select: { name: true } } },
      },
      dispatch: {
        select: {
          carrier: { select: { name: true } },
        },
      },
    },
  });

  if (!shipment) {
    return new Response("Not found", { status: 404 });
  }

  const customerAddress = [
    shipment.customer.prefecture,
    shipment.customer.city,
    shipment.customer.address,
  ]
    .filter(Boolean)
    .join("");

  const html = generateShippingLabelHTML({
    shipmentNumber: shipment.shipmentNumber,
    shipmentDate: shipment.shipmentDate ?? shipment.createdAt,
    customerName: shipment.customer.name,
    customerAddress: customerAddress || undefined,
    productCode: shipment.product.code,
    productName: shipment.product.name?.name ?? undefined,
    quantity: shipment.quantity,
    packagingType: shipment.packagingType,
    carrierName: shipment.dispatch?.carrier?.name ?? null,
    note: shipment.note,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
