import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { processingUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.processingOrder.findUnique({
    where: { id },
    include: {
      plant: { select: { id: true, code: true, name: true } },
      inputProduct: { include: { name: true, shape: true, color: true, grade: true } },
      outputProduct: { include: { name: true, shape: true, color: true, grade: true } },
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
  const result = await validateBody(request, processingUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.plantId !== undefined) data.plantId = body.plantId;
  if (body.processType !== undefined) data.processType = body.processType;
  if (body.inputProductId !== undefined) data.inputProductId = body.inputProductId;
  if (body.inputQuantity !== undefined) data.inputQuantity = body.inputQuantity;
  if (body.outputProductId !== undefined) data.outputProductId = body.outputProductId;
  if (body.outputQuantity !== undefined) data.outputQuantity = body.outputQuantity;
  if (body.yieldRate !== undefined) data.yieldRate = body.yieldRate;
  if (body.orderDate !== undefined) data.orderDate = new Date(body.orderDate);
  if (body.completedDate !== undefined) data.completedDate = body.completedDate ? new Date(body.completedDate) : null;
  if (body.status !== undefined) data.status = body.status;
  if (body.note !== undefined) data.note = body.note || null;
  if (body.equipmentName !== undefined) data.equipmentName = body.equipmentName || null;
  if (body.reProcessingFee !== undefined) data.reProcessingFee = body.reProcessingFee;

  const record = await prisma.processingOrder.update({
    where: { id },
    data,
    include: {
      plant: { select: { id: true, code: true, name: true } },
      inputProduct: { include: { name: true, shape: true, color: true, grade: true } },
      outputProduct: { include: { name: true, shape: true, color: true, grade: true } },
    },
  });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "ProcessingOrder", recordId: id });
  await prisma.processingOrder.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
