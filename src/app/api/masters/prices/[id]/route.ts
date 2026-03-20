import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { priceUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

// GET /api/masters/prices/[id]
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const price = await prisma.customerPrice.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, code: true, name: true } },
      product: {
        select: { id: true, code: true },
        include: { name: true, shape: true, color: true, grade: true },
      },
    },
  });

  if (!price) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(price);
});

// PUT /api/masters/prices/[id]
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, priceUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const price = await prisma.customerPrice.update({
    where: { id },
    data: {
      partnerId: body.partnerId,
      productId: body.productId,
      unitPrice: body.unitPrice,
      currency: body.currency,
      validFrom: new Date(body.validFrom),
      validTo: body.validTo ? new Date(body.validTo) : null,
      note: body.note,
    },
    include: {
      partner: { select: { id: true, code: true, name: true } },
      product: { include: { name: true, shape: true, color: true, grade: true } },
    },
  });

  return NextResponse.json(price);
});

// DELETE /api/masters/prices/[id]
export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "CustomerPrice", recordId: id });
  await prisma.customerPrice.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
