import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { businessCardUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.businessCard.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, businessCardUpdate);
  if ("error" in result) return result.error;
  const body = result.data as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  for (const key of [
    "companyName", "department", "position", "personName",
    "email", "phone", "mobile", "fax", "address", "website",
    "imageUrl", "note", "partnerId", "status",
  ]) {
    if (body[key] !== undefined) data[key] = body[key] ?? null;
  }

  const record = await prisma.businessCard.update({
    where: { id },
    data,
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });

  await createAuditLog({ action: "UPDATE", tableName: "BusinessCard", recordId: id, newData: record });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "BusinessCard", recordId: id });
  await prisma.businessCard.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
