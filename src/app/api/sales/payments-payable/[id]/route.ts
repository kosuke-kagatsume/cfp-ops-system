import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { paymentPayableUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";
import { requireApproval } from "@/lib/approval-guard";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.paymentPayable.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
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
  const result = await validateBody(request, paymentPayableUpdate);
  if ("error" in result) return result.error;
  const body = result.data;

  // 承認ゲート: 消込変更時は承認必須
  if (body.isReconciled !== undefined) {
    const { approved } = await requireApproval("PaymentPayable", id);
    if (!approved) {
      return NextResponse.json({ error: "承認が完了していません" }, { status: 403 });
    }
  }

  const data: Record<string, unknown> = {};
  if (body.supplierId !== undefined) data.supplierId = body.supplierId;
  if (body.paymentDate !== undefined) data.paymentDate = new Date(body.paymentDate);
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod;
  if (body.isReconciled !== undefined) data.isReconciled = body.isReconciled;
  if (body.note !== undefined) data.note = body.note;

  const record = await prisma.paymentPayable.update({ where: { id }, data });

  await createAuditLog({ action: "UPDATE", tableName: "PaymentPayable", recordId: id });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "PaymentPayable", recordId: id });
  await prisma.paymentPayable.delete({ where: { id } });
  return NextResponse.json({ success: true });
});
