import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoicePDF } from "@/lib/pdf-templates/invoice";
import type { InvoiceData } from "@/lib/document-templates";

export async function buildInvoicePDF(id: string): Promise<{
  element: React.ReactElement;
  filename: string;
}> {
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
          product: { select: { name: { select: { name: true } } } },
        },
      },
    },
  });
  if (!invoice) throw new Error("Invoice not found");

  const customerAddress = [invoice.customer.prefecture, invoice.customer.city, invoice.customer.address]
    .filter(Boolean)
    .join("");

  const data: InvoiceData = {
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
  };

  return {
    element: React.createElement(InvoicePDF, { data }),
    filename: `請求書_${invoice.invoiceNumber}.pdf`,
  };
}

export async function buildInvoicePDFBuffer(id: string): Promise<{
  buffer: Uint8Array;
  filename: string;
}> {
  const { element, filename } = await buildInvoicePDF(id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return { buffer: new Uint8Array(buffer), filename };
}
