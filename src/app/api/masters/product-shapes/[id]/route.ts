import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { simpleNameUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

// GET /api/masters/product-shapes/[id]
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const item = await prisma.productShape.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
});

// PUT /api/masters/product-shapes/[id]
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, simpleNameUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  const item = await prisma.productShape.update({
    where: { id },
    data: { name: body.name },
  });

  return NextResponse.json(item);
});

// DELETE /api/masters/product-shapes/[id]
export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "ProductShape", recordId: id });
  await prisma.productShape.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
