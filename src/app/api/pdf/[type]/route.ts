import { prisma } from "@/lib/db";
import { buildInvoicePDF } from "@/lib/pdf-builders/invoice";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import React from "react";
import * as Sentry from "@sentry/nextjs";

import { DeliveryNotePDF } from "@/lib/pdf-templates/delivery-note";
import { PurchaseOrderPDF } from "@/lib/pdf-templates/purchase-order";
import { QuotationPDF } from "@/lib/pdf-templates/quotation";
import { AnalysisCertificatePDF } from "@/lib/pdf-templates/analysis-certificate";
import { ShippingLabelPDF } from "@/lib/pdf-templates/shipping-label";

import type { DeliveryNoteData, PurchaseOrderData, QuotationData, CertificateData, ShippingData } from "@/lib/document-templates";
import { withErrorHandler } from "@/lib/api-error-handler";

const VALID_TYPES = ["invoice", "delivery-note", "purchase-order", "quotation", "analysis-certificate", "shipping-label"] as const;
type DocType = (typeof VALID_TYPES)[number];

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) => {
  const { type } = await params;
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(type as DocType)) {
    return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }

  try {
    const { element, filename } = await buildPDF(type as DocType, id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);
    const uint8 = new Uint8Array(buffer);

    return new Response(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    Sentry.captureException(err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
});

class NotFoundError extends Error {}

async function buildPDF(
  type: DocType,
  id: string
): Promise<{ element: React.ReactElement; filename: string }> {
  switch (type) {
    case "invoice":
      return buildInvoicePDF(id);
    case "delivery-note":
      return buildDeliveryNotePDF(id);
    case "purchase-order":
      return buildPurchaseOrderPDF(id);
    case "quotation":
      return buildQuotationPDF(id);
    case "analysis-certificate":
      return buildAnalysisCertificatePDF(id);
    case "shipping-label":
      return buildShippingLabelPDF(id);
  }
}

// --- Delivery Note ---
async function buildDeliveryNotePDF(id: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new NotFoundError();

  const data: DeliveryNoteData = {
    documentId: doc.id,
    title: doc.title,
    documentType: doc.documentType,
    createdAt: doc.createdAt,
    note: doc.note,
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
  };

  return {
    element: React.createElement(DeliveryNotePDF, { data }),
    filename: `納品書_${doc.title}.pdf`,
  };
}

// --- Purchase Order ---
async function buildPurchaseOrderPDF(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: { select: { name: true, address: true, prefecture: true, city: true } },
      pickupPartner: { select: { name: true } },
      product: { include: { name: { select: { name: true } } } },
      warehouse: { select: { name: true } },
    },
  });
  if (!purchase) throw new NotFoundError();

  const supplierAddress = [purchase.supplier.prefecture, purchase.supplier.city, purchase.supplier.address]
    .filter(Boolean)
    .join("");

  const data: PurchaseOrderData = {
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
  };

  return {
    element: React.createElement(PurchaseOrderPDF, { data }),
    filename: `買受書_${purchase.purchaseNumber}.pdf`,
  };
}

// --- Quotation ---
async function buildQuotationPDF(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, address: true, prefecture: true, city: true } },
    },
  });
  if (!quotation) throw new NotFoundError();

  const customerAddress = quotation.customer
    ? [quotation.customer.prefecture, quotation.customer.city, quotation.customer.address]
        .filter(Boolean)
        .join("")
    : undefined;

  const items = Array.isArray(quotation.items)
    ? (quotation.items as { product: string; name: string; qty: number; price: number }[])
    : [];

  const data: QuotationData = {
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
  };

  return {
    element: React.createElement(QuotationPDF, { data }),
    filename: `見積書_${quotation.quotationNumber}.pdf`,
  };
}

// --- Analysis Certificate ---
async function buildAnalysisCertificatePDF(id: string) {
  const cert = await prisma.analysisCertificate.findUnique({
    where: { id },
    include: {
      sample: {
        include: {
          product: { include: { name: { select: { name: true } } } },
          analysisResults: true,
        },
      },
    },
  });
  if (!cert) throw new NotFoundError();

  const results = cert.sample.analysisResults;
  const allPassed = results.length > 0 && results.every((r) => r.isPassed === true);
  const anyFailed = results.some((r) => r.isPassed === false);
  const overallJudgment =
    results.length === 0 ? null : anyFailed ? "不合格" : allPassed ? "合格" : null;

  const data: CertificateData = {
    certificateNumber: cert.certificateNumber,
    issueDate: cert.issueDate,
    sampleNumber: cert.sample.sampleNumber,
    sampleName: cert.sample.sampleName,
    productName: cert.sample.product?.displayName ?? cert.sample.product?.name?.name ?? "-",
    source: cert.sample.source,
    receivedDate: cert.sample.receivedDate,
    analysisResults: results.map((r) => ({
      testItem: r.testItem,
      standard: r.standard,
      result: r.result,
      unit: r.unit,
      isPassed: r.isPassed,
    })),
    overallJudgment,
    note: cert.note,
  };

  return {
    element: React.createElement(AnalysisCertificatePDF, { data }),
    filename: `分析成績書_${cert.certificateNumber}.pdf`,
  };
}

// --- Shipping Label ---
async function buildShippingLabelPDF(id: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, address: true, prefecture: true, city: true } },
      product: { include: { name: { select: { name: true } } } },
      dispatch: { select: { carrier: { select: { name: true } } } },
    },
  });
  if (!shipment) throw new NotFoundError();

  const customerAddress = [shipment.customer.prefecture, shipment.customer.city, shipment.customer.address]
    .filter(Boolean)
    .join("");

  const data: ShippingData = {
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
  };

  return {
    element: React.createElement(ShippingLabelPDF, { data }),
    filename: `送り状_${shipment.shipmentNumber}.pdf`,
  };
}
