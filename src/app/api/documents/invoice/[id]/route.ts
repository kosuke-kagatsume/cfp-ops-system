import { prisma } from "@/lib/db";
import { generateInvoiceHTML } from "@/lib/document-templates";
import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: { name: true, address: true, prefecture: true, city: true },
      },
      revenues: {
        select: {
          revenueNumber: true,
          amount: true,
          product: {
            select: { name: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  const customerAddress = [
    invoice.customer.prefecture,
    invoice.customer.city,
    invoice.customer.address,
  ]
    .filter(Boolean)
    .join("");

  const html = generateInvoiceHTML({
    invoiceNumber: invoice.invoiceNumber,
    billingDate: invoice.billingDate,
    dueDate: invoice.dueDate,
    customerName: invoice.customer.name,
    customerAddress: customerAddress || undefined,
    prevBalance: invoice.prevBalance,
    paymentReceived: invoice.paymentReceived,
    carryover: invoice.carryover,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    currency: invoice.currency,
    note: invoice.note,
    revenues: invoice.revenues.map((r) => ({
      revenueNumber: r.revenueNumber,
      productName: r.product?.name?.name ?? undefined,
      amount: r.amount,
    })),
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
