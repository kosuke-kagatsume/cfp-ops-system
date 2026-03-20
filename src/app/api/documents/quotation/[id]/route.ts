import { prisma } from "@/lib/db";
import { generateQuotationHTML } from "@/lib/document-templates";
import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: {
        select: { name: true, address: true, prefecture: true, city: true },
      },
    },
  });

  if (!quotation) {
    return new Response("Not found", { status: 404 });
  }

  const customerAddress = quotation.customer
    ? [
        quotation.customer.prefecture,
        quotation.customer.city,
        quotation.customer.address,
      ]
        .filter(Boolean)
        .join("")
    : undefined;

  // items is a JSON column
  const items = Array.isArray(quotation.items)
    ? (quotation.items as { product: string; name: string; qty: number; price: number }[])
    : [];

  const html = generateQuotationHTML({
    quotationNumber: quotation.quotationNumber,
    quotationDate: quotation.quotationDate,
    validUntil: quotation.validUntil,
    customerName: quotation.customer?.name ?? "-",
    customerAddress: customerAddress || undefined,
    subject: quotation.subject,
    items,
    subtotal: quotation.subtotal,
    taxAmount: quotation.taxAmount,
    total: quotation.total,
    currency: quotation.currency,
    note: quotation.note,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
