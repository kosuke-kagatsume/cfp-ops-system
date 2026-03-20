import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { partnerUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

// GET /api/masters/partners/[id]
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const partner = await prisma.businessPartner.findUnique({
    where: { id },
    include: { contacts: true, documentSettings: true },
  });

  if (!partner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(partner);
});

// PUT /api/masters/partners/[id]
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, partnerUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const partner = await prisma.businessPartner.update({
    where: { id },
    data: {
      name: body.name,
      nameKana: body.nameKana,
      shortName: body.shortName,
      isCustomer: body.isCustomer,
      isSupplier: body.isSupplier,
      isPickup: body.isPickup,
      isDelivery: body.isDelivery,
      isCarrier: body.isCarrier,
      postalCode: body.postalCode,
      prefecture: body.prefecture,
      city: body.city,
      address: body.address,
      tel: body.tel,
      fax: body.fax,
      email: body.email,
      closingDay: body.closingDay,
      paymentSiteMonths: body.paymentSiteMonths,
      currency: body.currency,
      invoiceNumber: body.invoiceNumber,
      isIsccCertified: body.isIsccCertified,
      isccCertNumber: body.isccCertNumber,
      isOverseas: body.isOverseas,
      countryCode: body.countryCode,
      isActive: body.isActive,
    },
  });

  return NextResponse.json(partner);
});

// DELETE /api/masters/partners/[id] (ソフトデリート)
export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "BusinessPartner", recordId: id });
  await prisma.businessPartner.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
